// Score deal: generates an AI-drafted scorecard from deal context + uploaded sources.
// Returns a partial scorecard patch (narrative + qualitative ratings) for human review.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  scorecard_id: string;
  deal_id: string;
}

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    company_overview: { type: "string" },
    investment_thesis: { type: "string" },
    traction_milestones: { type: "string" },
    business_model: { type: "string" },
    key_strengths: { type: "string" },
    key_risks: { type: "string" },
    investor_base: { type: "string" },
    competitive_landscape: { type: "string" },
    use_of_funds: { type: "string" },
    dca_value_add: { type: "string" },
    qualitative_ratings: {
      type: "object",
      additionalProperties: false,
      properties: {
        market: ratingProp(),
        product: ratingProp(),
        business_model: ratingProp(),
        team: ratingProp(),
        exit: ratingProp(),
      },
      required: ["market", "product", "business_model", "team", "exit"],
    },
  },
  required: ["qualitative_ratings"],
} as const;

function ratingProp() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "integer", minimum: 1, maximum: 5 },
      rationale: { type: "string" },
    },
    required: ["score", "rationale"],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY not configured" }, 500);
    }
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as Body;
    if (!body.scorecard_id || !body.deal_id) return json({ error: "Missing ids" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log run
    const { data: run } = await admin
      .from("analyst_runs")
      .insert({ deal_id: body.deal_id, trigger: "scorecard_ai_draft", status: "running", created_by: user.id })
      .select("id")
      .single();

    let [{ data: deal }, { data: thesis }, { data: calls }, { data: docs }, { data: dealFiles }, { data: scorecard }] = await Promise.all([
      admin.from("deals").select("*").eq("id", body.deal_id).maybeSingle(),
      admin.from("investment_thesis").select("*").limit(1).maybeSingle(),
      // Pull ALL call notes for this deal (no cap) so the analyst has full context
      admin.from("call_notes").select("title,call_date,content").eq("deal_id", body.deal_id).order("call_date", { ascending: false }),
      admin.from("scorecard_documents").select("kind,external_url,parsed_excerpt,file:file_attachments(file_name,file_url,file_type)").eq("scorecard_id", body.scorecard_id),
      // Pull ALL deal attachments (no cap)
      admin.from("file_attachments").select("file_name,file_url,file_type,file_size,created_at").eq("deal_id", body.deal_id).order("created_at", { ascending: false }),
      admin.from("deal_scorecards").select("*").eq("id", body.scorecard_id).maybeSingle(),
    ]);

    // Detect gated deck links (DocSend, Pitch, etc.) and auto-capture them via Browserless
    // so the analyst draft can reference the captured PDF instead of flagging a blocked link.
    const isGatedDeck = (u?: string | null) =>
      !!u && /(docsend\.com|pitch\.com\/v\/|app\.pitch\.com)/i.test(u);

    const candidateUrls = new Set<string>();
    for (const d of (docs ?? []) as Array<{ external_url: string | null }>) {
      if (isGatedDeck(d.external_url)) candidateUrls.add(d.external_url!);
    }
    for (const f of (dealFiles ?? []) as Array<{ file_url: string }>) {
      if (isGatedDeck(f.file_url)) candidateUrls.add(f.file_url);
    }
    // Also try the deal's own pitch_deck_url field if present
    const pitchDeckUrl = (deal as { pitch_deck_url?: string | null } | null)?.pitch_deck_url;
    if (isGatedDeck(pitchDeckUrl)) candidateUrls.add(pitchDeckUrl!);

    // Skip capture if any captured PDF for this deal already exists
    const alreadyCaptured = (dealFiles ?? []).some(
      (f) => f.file_url?.includes(`${body.deal_id}_docsend_`),
    );

    const captureLog: string[] = [];
    if (candidateUrls.size && !alreadyCaptured && Deno.env.get("BROWSERLESS_API_KEY")) {
      for (const url of candidateUrls) {
        try {
          console.log(`[score-deal] auto-capturing gated deck: ${url}`);
          const res = await fetch(`${SUPABASE_URL}/functions/v1/capture-docsend`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({ url, deal_id: body.deal_id }),
          });
          const text = await res.text();
          if (res.ok) {
            captureLog.push(`Captured ${url}`);
          } else {
            captureLog.push(`Failed to capture ${url}: ${text.slice(0, 200)}`);
          }
        } catch (e) {
          captureLog.push(`Failed to capture ${url}: ${(e as Error).message}`);
        }
      }
      // Re-fetch deal attachments to pick up newly captured PDFs
      const { data: refreshed } = await admin
        .from("file_attachments")
        .select("file_name,file_url,file_type,file_size,created_at")
        .eq("deal_id", body.deal_id)
        .order("created_at", { ascending: false });
      dealFiles = refreshed;
    }

    // After capture attempts, anything still recognised as a raw gated URL goes in the flag list
    const gatedDocsend: string[] = [];

    const sourceLines: string[] = [];
    for (const d of (docs ?? []) as Array<{ kind: string; external_url: string | null; parsed_excerpt: string | null; file: { file_name: string; file_url: string; file_type: string | null } | null }>) {
      const label = d.file?.file_name ?? d.external_url ?? "(untitled)";
      if (isGatedDeck(d.external_url)) gatedDocsend.push(d.external_url!);
      sourceLines.push(`- [${d.kind}] ${label}${d.parsed_excerpt ? `\n  Excerpt: ${d.parsed_excerpt.slice(0, 2500)}` : ""}`);
    }

    // Existing deal-level attachments (pitch decks, financials, etc. uploaded outside the scorecard panel)
    const dealFileLines: string[] = [];
    for (const f of (dealFiles ?? []) as Array<{ file_name: string; file_url: string; file_type: string | null; file_size: number | null; created_at: string }>) {
      const kb = f.file_size ? ` (${Math.round(f.file_size / 1024)} KB)` : "";
      const isCaptured = f.file_url?.includes(`${body.deal_id}_docsend_`);
      if (isGatedDeck(f.file_url) && !isCaptured) gatedDocsend.push(f.file_url);
      const tag = isCaptured ? " [auto-captured deck PDF]" : "";
      dealFileLines.push(`- ${f.file_name}${kb} [${f.file_type ?? "file"}]${tag} — ${f.file_url}`);
    }

    // Use full call note content (generous per-note cap)
    const callLines = (calls ?? [])
      .map((c) => `### ${c.title} (${c.call_date})\n${(c.content ?? "").slice(0, 8000)}`)
      .join("\n\n");

    const prompt = [
      `You are an analyst at DCA, a venture firm. Draft an investment scorecard for ${deal?.company_name ?? "this company"} for human review.`,
      "",
      "Return a STRICT JSON object matching the provided schema. Be specific, cite evidence from sources (call notes, attachments, scorecard inputs), and avoid generic platitudes. Each qualitative rationale should be 2-3 sentences. Narrative fields should be 2-5 sentences. If a piece of evidence is missing, say so rather than inventing it.",
      captureLog.length
        ? `\nDECK AUTO-CAPTURE: ${captureLog.join(" | ")}. Captured deck PDFs are listed under "Existing deal attachments" and are image-only screenshots — you cannot read the text directly, but you can reference them by name and note that a visual deck capture is on file.`
        : "",
      gatedDocsend.length
        ? `\nNOTE: The following deck links are gated and could not be auto-captured. Do not fabricate their contents — flag in key_risks that the deck needs to be unlocked or exported as PDF:\n${gatedDocsend.map((u) => `- ${u}`).join("\n")}`
        : "",
      "## Investment thesis",
      thesis?.narrative ?? "(none on file)",
      thesis ? `Target sectors: ${(thesis.sectors ?? []).join(", ")}\nTarget stages: ${(thesis.stages ?? []).join(", ")}\nMust-haves: ${(thesis.must_haves ?? []).join("; ")}\nDeal-breakers: ${(thesis.deal_breakers ?? []).join("; ")}` : "",
      "",
      "## Deal record",
      JSON.stringify({
        company_name: deal?.company_name, sector: deal?.sector, stage: deal?.round_stage,
        location: deal?.location, website: deal?.website, description: deal?.description,
        round_size: deal?.round_size, post_money_valuation: deal?.post_money_valuation,
        revenue: deal?.revenue, total_funding_raised: deal?.total_funding_raised,
        founded_year: deal?.founded_year,
      }, null, 2),
      "",
      "## Existing scorecard inputs",
      JSON.stringify({
        current_arr: scorecard?.current_arr, prior_arr: scorecard?.prior_arr,
        gross_burn: scorecard?.gross_burn, net_burn: scorecard?.net_burn,
        cash_balance: scorecard?.cash_balance, gross_margin: scorecard?.gross_margin,
        nrr: scorecard?.nrr, grr: scorecard?.grr, monthly_churn: scorecard?.monthly_churn,
        founder_ownership_pct: scorecard?.founder_ownership_pct,
      }, null, 2),
      "",
      "## Sources attached to scorecard",
      sourceLines.join("\n") || "(none uploaded directly to scorecard)",
      "",
      "## Existing deal attachments (decks, financials, memos already on the deal record)",
      dealFileLines.join("\n") || "(no attachments on the deal)",
      "",
      "## Recent call notes / transcripts",
      callLines || "(no call notes yet)",
    ].join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a rigorous, evidence-driven VC analyst. Output JSON only." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_scorecard_draft",
            description: "Submit the drafted scorecard fields",
            parameters: RESPONSE_SCHEMA,
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_scorecard_draft" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited — try again shortly" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Lovable settings." }, 402);
    if (!aiRes.ok) {
      const text = await aiRes.text();
      await admin.from("analyst_runs").update({ status: "failed", error: text.slice(0, 1000), completed_at: new Date().toISOString() }).eq("id", run?.id ?? "");
      return json({ error: "AI request failed", details: text.slice(0, 500) }, 502);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return json({ error: "No tool call in AI response" }, 502);
    }
    const draft = JSON.parse(toolCall.function.arguments);

    // Persist as draft (do not auto-approve)
    const patch: Record<string, unknown> = {
      ai_run_id: run?.id ?? null,
      status: "draft",
      qualitative_ratings: draft.qualitative_ratings,
    };
    for (const k of ["company_overview","investment_thesis","traction_milestones","business_model","key_strengths","key_risks","investor_base","competitive_landscape","use_of_funds","dca_value_add"]) {
      if (draft[k]) patch[k] = draft[k];
    }
    await admin.from("deal_scorecards").update(patch).eq("id", body.scorecard_id);

    await admin.from("analyst_runs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      summary: draft.investment_thesis ?? null,
      sources: (docs ?? []).map((d) => ({ kind: d.kind, url: d.external_url ?? d.file?.file_url })),
    }).eq("id", run?.id ?? "");

    return json({ ok: true, draft });
  } catch (e) {
    console.error("score-deal error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
