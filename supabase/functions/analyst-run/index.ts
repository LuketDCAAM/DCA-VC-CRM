// Analyst agent — scores a single deal vs the investment thesis.
// POST { dealId, trigger?: 'manual'|'auto' }
import { generateText, stepCountIs, tool } from "npm:ai@6.0.182";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@2.0.47";
import { z } from "npm:zod@4.4.3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { researchTools } from "../_shared/research-tools.ts";
import { resolveUserModel, markCredentialUsed } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// gateway kept available for any non-BYOK callers via resolveUserModel fallback.
const _gateway = createOpenAICompatible({
  name: "lovable",
  baseURL: "https://ai.gateway.lovable.dev/v1",
  headers: {
    "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
    "X-Lovable-AIG-SDK": "vercel-ai-sdk",
  },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claimsData?.claims?.sub as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const Body = z.object({
      dealId: z.string().uuid(),
      trigger: z.enum(["manual", "auto"]).default("manual"),
    });
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { dealId, trigger } = parsed.data;

    // Load deal + thesis + recent call notes
    const [{ data: deal }, { data: thesis }, { data: notes }] = await Promise.all([
      supabase.from("deals").select("*").eq("id", dealId).maybeSingle(),
      supabase.from("investment_thesis").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("call_notes").select("title,call_date,content").eq("deal_id", dealId).order("call_date", { ascending: false }).limit(5),
    ]);
    if (!deal) {
      return new Response(JSON.stringify({ error: "Deal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the run row
    const { data: runRow } = await supabase
      .from("analyst_runs")
      .insert({
        deal_id: dealId,
        trigger,
        status: "running",
        created_by: userId,
      })
      .select("id")
      .single();
    const runId = runRow?.id as string | undefined;

    // Resolve model — caller's BYOK Claude key or Lovable gateway fallback.
    const resolved = await resolveUserModel({ userId, fallbackModelId: "google/gemini-3-flash-preview" });

    // Also create an agent_runs row so proposals show up in the standard panel
    const { data: agentRun } = await supabase
      .from("agent_runs")
      .insert({
        user_id: userId,
        agent_type: "analyst",
        trigger,
        status: "running",
        model: `${resolved.provider}:${resolved.modelId}`,
      })
      .select("id")
      .single();
    const agentRunId = agentRun?.id as string;

    const sources: Array<{ title?: string; url: string }> = [];

    const tools = {
      ...researchTools(),
      record_source: tool({
        description: "Record a citation (url + optional title) you used while analysing.",
        inputSchema: z.object({ url: z.string().url(), title: z.string().optional() }),
        execute: async ({ url, title }) => {
          sources.push({ url, title });
          return { ok: true };
        },
      }),
      propose_score_deal: tool({
        description: "Propose a final deal score (0-100) with rationale. Lands in approval queue.",
        inputSchema: z.object({
          score: z.number().int().min(0).max(100),
          rationale: z.string(),
        }),
        execute: async ({ score, rationale }) => {
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: agentRunId,
              user_id: userId,
              action_type: "score_deal",
              target_table: "deals",
              target_id: dealId,
              payload: { deal_score: score },
              rationale,
              status: "pending",
            })
            .select("id")
            .single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),
      propose_update_deal: tool({
        description: "Propose enrichments (sector, stage, location, description, etc). Lands in approval queue.",
        inputSchema: z.object({
          changes: z.record(z.string(), z.unknown()),
          rationale: z.string(),
        }),
        execute: async ({ changes, rationale }) => {
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: agentRunId,
              user_id: userId,
              action_type: "update_deal",
              target_table: "deals",
              target_id: dealId,
              payload: changes,
              rationale,
              status: "pending",
            })
            .select("id")
            .single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),
      propose_create_task: tool({
        description: "Propose a follow-up task for the analyst's recommended next step.",
        inputSchema: z.object({
          title: z.string(),
          description: z.string().optional(),
          reminder_date: z.string(),
          priority: z.enum(["low", "medium", "high"]).default("medium"),
          rationale: z.string(),
        }),
        execute: async ({ rationale, ...task }) => {
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: agentRunId,
              user_id: userId,
              action_type: "create_task",
              target_table: "reminders",
              payload: { ...task, deal_id: dealId },
              rationale,
              status: "pending",
            })
            .select("id")
            .single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),
    };

    const thesisBlock = thesis ? `
## Investment Thesis
- Sectors: ${(thesis.sectors ?? []).join(", ") || "any"}
- Stages: ${(thesis.stages ?? []).join(", ") || "any"}
- Check size: ${thesis.check_size_min ?? "?"} - ${thesis.check_size_max ?? "?"}
- Geographies: ${(thesis.geographies ?? []).join(", ") || "any"}
- Business models: ${(thesis.business_models ?? []).join(", ") || "any"}
- Must-haves: ${(thesis.must_haves ?? []).join("; ") || "—"}
- Deal-breakers: ${(thesis.deal_breakers ?? []).join("; ") || "—"}
- Scoring weights: sector=${thesis.weight_sector_fit}, stage=${thesis.weight_stage_fit}, traction=${thesis.weight_traction}, team=${thesis.weight_team}, market=${thesis.weight_market}
- Narrative: ${thesis.narrative ?? ""}
- Notion transcripts DB id: ${thesis.notion_transcripts_db_id ?? "(not configured)"}
` : "(No thesis configured — use generic VC heuristics.)";

    const dealBlock = `
## Deal under review
${JSON.stringify({
  id: deal.id,
  company_name: deal.company_name,
  description: deal.description,
  sector: deal.sector,
  pipeline_stage: deal.pipeline_stage,
  round_stage: deal.round_stage,
  round_size: deal.round_size,
  post_money_valuation: deal.post_money_valuation,
  revenue: deal.revenue,
  location: deal.location,
  website: deal.website,
  linkedin_url: deal.linkedin_url,
  founded_year: deal.founded_year,
  employee_count_range: deal.employee_count_range,
  total_funding_raised: deal.total_funding_raised,
}, null, 2)}

Recent call notes (${notes?.length ?? 0}):
${(notes ?? []).map((n) => `- [${n.call_date}] ${n.title}: ${(n.content ?? "").slice(0, 400)}`).join("\n")}
`;

    const SYSTEM = `You are a senior VC investment analyst. Your job: evaluate one inbound deal against the fund's thesis, do light external research, read any relevant Notion call transcripts, and produce a structured recommendation.

Process:
1. Read the deal + thesis below.
2. If a Notion transcripts DB id is configured, search it for the company name and read the most relevant transcript page.
3. Use web_search + scrape_url to confirm what the company does, traction signals, recent news, competitive landscape. Call record_source for every URL you actually use.
4. Score the deal 0-100 against the rubric weights. Lower scores for thesis misfit / dealbreakers.
5. Always call propose_score_deal exactly once with the final score.
6. Optionally call propose_update_deal to fill in obvious missing enrichment fields (sector, location, description, etc).
7. Optionally call propose_create_task for the recommended next step.
8. Then return a final markdown report:
\`\`\`
## Summary
<2-3 sentences>
## Score: <n>/100
- Sector fit: ...
- Stage fit: ...
- Traction: ...
- Team: ...
- Market: ...
## Key findings
- ...
## Recommended next step
...
\`\`\`

Be concise and skeptical. Do not invent facts — if research returned nothing useful, say so.`;

    const prompt = `${thesisBlock}\n${dealBlock}\n\nProduce the analysis now.`;

    let result;
    try {
      result = await generateText({
        model: resolved.model,
        system: SYSTEM,
        prompt,
        tools,
        stopWhen: stepCountIs(50),
        abortSignal: req.signal,
      });
      if (resolved.hasUserCredential) await markCredentialUsed(userId, resolved.provider as any, "ok");
    } catch (err) {
      if (resolved.hasUserCredential) {
        await markCredentialUsed(userId, resolved.provider as any, "error", String(err).slice(0, 500));
      }
      throw err;
    }

    // Extract the score we proposed (look at agent_actions row inserted in this run)
    const { data: scoreAction } = await supabase
      .from("agent_actions")
      .select("payload,rationale")
      .eq("run_id", agentRunId)
      .eq("action_type", "score_deal")
      .maybeSingle();
    const finalScore = (scoreAction?.payload as { deal_score?: number } | null)?.deal_score ?? null;

    const { data: proposed } = await supabase
      .from("agent_actions")
      .select("id,action_type,rationale,payload,status")
      .eq("run_id", agentRunId)
      .order("created_at", { ascending: true });

    if (runId) {
      await supabase
        .from("analyst_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          score: finalScore,
          summary: result.text,
          sources,
          proposed_actions: proposed ?? [],
        })
        .eq("id", runId);
    }
    if (agentRunId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          prompt_tokens: result.usage?.inputTokens ?? null,
          completion_tokens: result.usage?.outputTokens ?? null,
        })
        .eq("id", agentRunId);
    }

    return new Response(
      JSON.stringify({
        runId,
        score: finalScore,
        summary: result.text,
        sources,
        proposed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyst-run error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
