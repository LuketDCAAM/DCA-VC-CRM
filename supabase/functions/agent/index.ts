// CRM Agent edge function
// Streams Vercel AI SDK chat responses with CRM tools.
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "npm:ai@6.0.182";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@2.0.47";
import { z } from "npm:zod@4.4.3";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const gateway = createOpenAICompatible({
  name: "lovable",
  baseURL: "https://ai.gateway.lovable.dev/v1",
  headers: {
    "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
    "X-Lovable-AIG-SDK": "vercel-ai-sdk",
  },
});

const SYSTEM_PROMPT = `You are the AI assistant inside a venture-capital CRM.

You can read deals, investors, contacts, call notes, and tasks for the signed-in user.
For mutating actions (updating a deal, creating a task, drafting an email, scoring a deal,
suggesting investor matches), you must call the corresponding "propose_*" tool. These
proposals land in an approval queue — the user reviews and applies them; do NOT pretend
they are already applied.

Be concise. Format with markdown. When listing deals or investors, use compact tables or
bullet lists with the company name in bold. When you reference a deal or investor, include
its name (and ID in parentheses when helpful). When the user asks something vague, call
search tools first instead of guessing.

If you finish without proposing any action, just answer the question.`;

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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    console.log("agent request body keys:", Object.keys(body), "messages type:", Array.isArray(body.messages) ? `array(${body.messages.length})` : typeof body.messages);
    let messages = body.messages as UIMessage[] | undefined;
    const threadId = body.threadId as string | undefined;

    // ai-sdk v5/v6 DefaultChatTransport may send a single `message` instead of full `messages`.
    if (!Array.isArray(messages)) {
      const single = (body as { message?: UIMessage }).message;
      if (single) {
        // Load prior thread history from DB to provide full context
        let history: UIMessage[] = [];
        if (threadId) {
          const { data } = await supabase
            .from("agent_messages")
            .select("role,parts")
            .eq("thread_id", threadId)
            .order("created_at", { ascending: true });
          history = (data ?? []).map((m, i) => ({
            id: `hist-${i}`,
            role: m.role as UIMessage["role"],
            parts: (m.parts as unknown) as UIMessage["parts"],
          }));
        }
        messages = [...history, single];
      } else {
        return new Response(JSON.stringify({ error: "Missing messages" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create an agent_runs row for this turn
    const { data: runRow } = await supabase
      .from("agent_runs")
      .insert({
        user_id: userId,
        agent_type: "assistant",
        trigger: "chat",
        thread_id: threadId ?? null,
        status: "running",
        model: "google/gemini-3-flash-preview",
      })
      .select("id")
      .single();
    const runId = runRow?.id as string | undefined;

    // ---------- Tools ----------
    const tools = {
      search_deals: tool({
        description:
          "Search the user's deals by company name, sector, pipeline stage, or text. Returns up to 25 matches.",
        inputSchema: z.object({
          query: z.string().optional().describe("Free-text match against company_name/description/sector"),
          pipeline_stage: z.string().optional(),
          min_score: z.number().optional(),
          limit: z.number().int().min(1).max(50).default(25),
        }),
        execute: async ({ query, pipeline_stage, min_score, limit }) => {
          let q = supabase
            .from("deals")
            .select(
              "id,company_name,pipeline_stage,sector,deal_score,round_stage,round_size,location,last_call_date,next_steps,updated_at",
            )
            .order("updated_at", { ascending: false })
            .limit(limit);
          if (pipeline_stage) q = q.eq("pipeline_stage", pipeline_stage);
          if (typeof min_score === "number") q = q.gte("deal_score", min_score);
          if (query) q = q.or(`company_name.ilike.%${query}%,sector.ilike.%${query}%,description.ilike.%${query}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, deals: data };
        },
      }),

      get_deal: tool({
        description: "Fetch the full record for a single deal by id.",
        inputSchema: z.object({ deal_id: z.string().uuid() }),
        execute: async ({ deal_id }) => {
          const { data, error } = await supabase.from("deals").select("*").eq("id", deal_id).maybeSingle();
          if (error) return { error: error.message };
          return data ?? { error: "Not found" };
        },
      }),

      list_call_notes: tool({
        description: "List call notes for a given deal, most recent first.",
        inputSchema: z.object({ deal_id: z.string().uuid(), limit: z.number().int().min(1).max(50).default(10) }),
        execute: async ({ deal_id, limit }) => {
          const { data, error } = await supabase
            .from("call_notes")
            .select("id,title,content,call_date,created_at")
            .eq("deal_id", deal_id)
            .order("call_date", { ascending: false })
            .limit(limit);
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, notes: data };
        },
      }),

      search_investors: tool({
        description:
          "Search investors by name, firm, sector, stage, or check-size range. Returns up to 25 matches.",
        inputSchema: z.object({
          query: z.string().optional(),
          sector: z.string().optional(),
          stage: z.string().optional(),
          min_check_size: z.number().optional(),
          max_check_size: z.number().optional(),
          limit: z.number().int().min(1).max(50).default(25),
        }),
        execute: async ({ query, sector, stage, min_check_size, max_check_size, limit }) => {
          let q = supabase
            .from("investors")
            .select(
              "id,contact_name,firm_name,location,preferred_sectors,preferred_investment_stage,average_check_size,linkedin_url",
            )
            .limit(limit);
          if (sector) q = q.contains("preferred_sectors", [sector]);
          if (stage) q = q.eq("preferred_investment_stage", stage);
          if (typeof min_check_size === "number") q = q.gte("average_check_size", min_check_size);
          if (typeof max_check_size === "number") q = q.lte("average_check_size", max_check_size);
          if (query) q = q.or(`contact_name.ilike.%${query}%,firm_name.ilike.%${query}%`);
          const { data, error } = await q;
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, investors: data };
        },
      }),

      list_open_tasks: tool({
        description: "List the user's open tasks (reminders not yet completed).",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
        execute: async ({ limit }) => {
          const { data, error } = await supabase
            .from("reminders")
            .select("id,title,description,reminder_date,priority,deal_id,investor_id")
            .eq("is_completed", false)
            .order("reminder_date", { ascending: true })
            .limit(limit);
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, tasks: data };
        },
      }),

      stale_deals: tool({
        description:
          "Find deals in active pipeline stages with no recent updates. Useful for triage.",
        inputSchema: z.object({
          days_inactive: z.number().int().min(1).max(365).default(14),
          limit: z.number().int().min(1).max(50).default(20),
        }),
        execute: async ({ days_inactive, limit }) => {
          const cutoff = new Date(Date.now() - days_inactive * 86400_000).toISOString();
          const { data, error } = await supabase
            .from("deals")
            .select("id,company_name,pipeline_stage,deal_score,last_call_date,updated_at,next_steps")
            .lt("updated_at", cutoff)
            .not("pipeline_stage", "in", '("Invested","Passed","Inactive")')
            .order("updated_at", { ascending: true })
            .limit(limit);
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, stale_deals: data };
        },
      }),

      // ----- Mutating tools: write to agent_actions as `pending` -----
      propose_update_deal: tool({
        description:
          "Propose updates to fields on a deal. Lands in the approval queue — the user must approve before changes are applied.",
        inputSchema: z.object({
          deal_id: z.string().uuid(),
          changes: z.record(z.string(), z.unknown()).describe("Object of column → new value"),
          rationale: z.string().describe("One-sentence reason the user should approve"),
        }),
        execute: async ({ deal_id, changes, rationale }) => {
          if (!runId) return { error: "No run id" };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId,
              user_id: userId,
              action_type: "update_deal",
              target_table: "deals",
              target_id: deal_id,
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

      propose_score_deal: tool({
        description:
          "Propose a deal score (0-100) plus rationale. Lands in the approval queue.",
        inputSchema: z.object({
          deal_id: z.string().uuid(),
          score: z.number().int().min(0).max(100),
          rationale: z.string(),
        }),
        execute: async ({ deal_id, score, rationale }) => {
          if (!runId) return { error: "No run id" };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId,
              user_id: userId,
              action_type: "score_deal",
              target_table: "deals",
              target_id: deal_id,
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

      propose_create_task: tool({
        description:
          "Propose a new task/reminder. Lands in the approval queue. assigned_to defaults to the current user.",
        inputSchema: z.object({
          title: z.string(),
          description: z.string().optional(),
          reminder_date: z.string().describe("YYYY-MM-DD"),
          priority: z.enum(["low", "medium", "high"]).default("medium"),
          deal_id: z.string().uuid().optional(),
          investor_id: z.string().uuid().optional(),
          rationale: z.string(),
        }),
        execute: async ({ rationale, ...task }) => {
          if (!runId) return { error: "No run id" };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId,
              user_id: userId,
              action_type: "create_task",
              target_table: "reminders",
              payload: task,
              rationale,
              status: "pending",
            })
            .select("id")
            .single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),

      propose_draft_email: tool({
        description:
          "Draft an outbound email (subject + body). Lands in the approval queue — nothing is sent automatically.",
        inputSchema: z.object({
          to: z.string().email(),
          subject: z.string(),
          body: z.string(),
          context: z.object({
            deal_id: z.string().uuid().optional(),
            investor_id: z.string().uuid().optional(),
          }).optional(),
          rationale: z.string(),
        }),
        execute: async ({ rationale, ...email }) => {
          if (!runId) return { error: "No run id" };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId,
              user_id: userId,
              action_type: "draft_email",
              payload: email,
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

    const result = streamText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
      abortSignal: req.signal,
      onFinish: async ({ usage }) => {
        if (!runId) return;
        await supabase
          .from("agent_runs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            prompt_tokens: usage?.inputTokens ?? null,
            completion_tokens: usage?.outputTokens ?? null,
          })
          .eq("id", runId);
      },
      onError: async ({ error }) => {
        console.error("agent stream error", error);
        if (runId) {
          await supabase
            .from("agent_runs")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              error: String(error),
            })
            .eq("id", runId);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: corsHeaders,
      originalMessages: messages,
      onFinish: async ({ responseMessage }) => {
        if (!threadId) return;
        if (!responseMessage.parts || responseMessage.parts.length === 0) return;
        // Persist the user's last message + assistant response
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabase.from("agent_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as never,
          });
        }
        await supabase.from("agent_messages").insert({
          thread_id: threadId,
          user_id: userId,
          role: "assistant",
          parts: responseMessage.parts as never,
        });
        await supabase
          .from("agent_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      },
    });
  } catch (e) {
    console.error("agent error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
