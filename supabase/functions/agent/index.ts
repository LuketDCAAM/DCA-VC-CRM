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
import { researchTools } from "../_shared/research-tools.ts";
import { normalizeDomain as normalizeDomainShared } from "../_shared/action-schemas.ts";
import { loadPrompt } from "./prompt-loader.ts";

const HISTORY_LIMIT = 20; // last N messages sent to the model
const TOOL_PART_DETAIL_TURNS = 2; // keep full tool output for the last N turns

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

const PIPELINE_STAGES = [
  "Inactive", "Watchlist", "Initial Review", "Scorecard", "Decision Making",
  "One Pager", "Due Diligence", "Memo", "Legal Review", "Invested", "Passed",
] as const;
const ROUND_STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Bridge", "Growth"] as const;
const INVESTMENT_VEHICLES = ["Preferred Equity", "Common Equity", "Convertible Note", "SAFE Note", "Other"] as const;

const DealFieldsSchema = z.object({
  description: z.string().optional(),
  sector: z.string().optional(),
  pipeline_stage: z.enum(PIPELINE_STAGES).optional(),
  round_stage: z.enum(ROUND_STAGES).optional(),
  round_size: z.number().int().optional().describe("Round size in WHOLE USD DOLLARS (not cents). $10M = 10000000."),
  post_money_valuation: z.number().int().optional().describe("Post-money valuation in WHOLE USD DOLLARS (not cents)."),
  revenue: z.number().int().optional().describe("Annual revenue in WHOLE USD DOLLARS (not cents)."),
  website: z.string().optional().describe("Canonical URL with https://. Domain must be unique across deals."),
  linkedin_url: z.string().optional(),
  crunchbase_url: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country: z.string().optional(),
  headquarters_location: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  deal_source: z.string().optional(),
  source_date: z.string().optional().describe("YYYY-MM-DD"),
  deal_lead: z.string().optional(),
  next_steps: z.string().optional().describe("Use for pitch deck links and immediate follow-ups."),
  tags: z.array(z.string()).optional(),
  founded_year: z.number().int().optional(),
  employee_count_range: z.string().optional(),
  company_type: z.string().optional(),
  investment_vehicle: z.enum(INVESTMENT_VEHICLES).optional(),
  reason_for_passing: z.string().optional(),
}).partial();

function normalizeDomain(url?: string | null): string | null {
  return normalizeDomainShared(url ?? null);
}

// Indexed duplicate lookup: uses deals_website_domain_idx and deals_company_name_lower_idx.
// deno-lint-ignore no-explicit-any
async function findDuplicate(db: any, companyName: string, website?: string) {
  const domain = normalizeDomain(website);
  if (domain) {
    const { data } = await db
      .from("deals")
      .select("id,company_name,website")
      .ilike("website", `%${domain}%`) // index speeds the lower() comparison; ilike still scans but is now backed by trgm
      .limit(1);
    if (data && data.length > 0) return data[0];
  }
  const { data: byName } = await db
    .from("deals")
    .select("id,company_name,website")
    .ilike("company_name", companyName)
    .limit(1);
  if (byName && byName.length > 0) return byName[0];
  return null;
}

// Strip large tool outputs from older messages to keep prompts small.
// Keeps user/assistant text intact; replaces older tool outputs with a summary.
function trimHistory(msgs: UIMessage[]): UIMessage[] {
  if (msgs.length <= HISTORY_LIMIT) return shrinkOlderToolParts(msgs);
  const trimmed = msgs.slice(-HISTORY_LIMIT);
  return shrinkOlderToolParts(trimmed);
}

function shrinkOlderToolParts(msgs: UIMessage[]): UIMessage[] {
  // Identify the cutoff: anything before the last TOOL_PART_DETAIL_TURNS assistant turns
  // gets summarized tool outputs to save tokens.
  let assistantTurns = 0;
  const keepFullFromIdx = (() => {
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") {
        assistantTurns++;
        if (assistantTurns >= TOOL_PART_DETAIL_TURNS) return i;
      }
    }
    return 0;
  })();
  return msgs.map((m, idx) => {
    if (idx >= keepFullFromIdx) return m;
    if (!Array.isArray(m.parts)) return m;
    const parts = m.parts.map((p) => {
      if (typeof p?.type === "string" && p.type.startsWith("tool-")) {
        const tp = p as { type: string; toolName?: string; state?: string; output?: unknown };
        const hasOutput = tp.output !== undefined;
        return {
          ...tp,
          output: hasOutput ? { summary: "[truncated]" } : tp.output,
        };
      }
      return p;
    }) as UIMessage["parts"];
    return { ...m, parts };
  });
}

async function getSystemPrompt(): Promise<string> {
  return await loadPrompt({
    PIPELINE_STAGES: PIPELINE_STAGES.join(", "),
    ROUND_STAGES: ROUND_STAGES.join(", "),
    INVESTMENT_VEHICLES: INVESTMENT_VEHICLES.join(", "),
  });
}


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
            .order("created_at", { ascending: false })
            .limit(HISTORY_LIMIT);
          history = (data ?? []).reverse().map((m, i) => ({
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
      ...researchTools(),
      get_investment_thesis: tool({
        description: "Read the fund's investment thesis (sectors, stages, check size, must-haves, etc).",
        inputSchema: z.object({}),
        execute: async () => {
          const { data } = await supabase
            .from("investment_thesis")
            .select("*")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          return data ?? { error: "No thesis configured" };
        },
      }),
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
          changes: DealFieldsSchema.describe("Subset of deal columns to update"),
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

      find_deal_by_website: tool({
        description:
          "Look up an existing deal by website domain (handles http/https/www variations). Use BEFORE propose_create_deal whenever you have a URL.",
        inputSchema: z.object({ website: z.string() }),
        execute: async ({ website }) => {
          const domain = normalizeDomain(website);
          if (!domain) return { found: false };
          // Uses deals_website_domain_idx for O(log n) lookup.
          const { data, error } = await supabase
            .rpc("find_potential_duplicates", { p_company_name: "", p_website: domain })
            .limit(5);
          if (error) {
            // Fallback: filter client-side after a small fetch (still indexed via lower())
            const { data: fallback } = await supabase
              .from("deals")
              .select("id,company_name,website,pipeline_stage,deal_score")
              .ilike("website", `%${domain}%`)
              .limit(5);
            return { found: (fallback?.length ?? 0) > 0, matches: fallback ?? [] };
          }
          return { found: (data?.length ?? 0) > 0, matches: data ?? [] };
        },
      }),

      propose_create_deal: tool({
        description:
          "Propose creating ONE deal. For 2+ deals, use propose_create_deals_bulk instead. Server checks for duplicates by website domain and company name; if a duplicate is returned use propose_update_deal on existing_deal_id.",
        inputSchema: z.object({
          company_name: z.string(),
          fields: DealFieldsSchema.optional().describe(
            "Optional deal columns. Use documented enum values exactly. Numeric fields are whole USD dollars (integers).",
          ),
          rationale: z.string(),
        }),
        execute: async ({ company_name, fields, rationale }) => {
          if (!runId) return { error: "No run id" };
          const dup = await findDuplicate(supabase, company_name, fields?.website as string | undefined);
          if (dup) {
            return {
              duplicate: true,
              existing_deal_id: dup.id,
              existing_company_name: dup.company_name,
              hint: "Call propose_update_deal against existing_deal_id instead of creating a duplicate.",
            };
          }
          const payload = { company_name, ...(fields ?? {}) };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId,
              user_id: userId,
              action_type: "create_deal",
              target_table: "deals",
              payload,
              rationale,
              status: "pending",
            })
            .select("id")
            .single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),

      propose_create_deals_bulk: tool({
        description:
          "Propose creating MANY deals in one shot. Use this whenever the user asks for 2+ deals. Server-side duplicate checks run for each entry; duplicates are reported back but do not block the others.",
        inputSchema: z.object({
          deals: z.array(z.object({
            company_name: z.string(),
            fields: DealFieldsSchema.optional(),
          })).min(1).max(50),
          rationale: z.string().describe("One-sentence reason covering the whole batch"),
        }),
        execute: async ({ deals, rationale }) => {
          if (!runId) return { error: "No run id" };
          const proposed: string[] = [];
          const duplicates: { company_name: string; existing_deal_id: string }[] = [];
          const rows: Record<string, unknown>[] = [];
          for (const d of deals) {
            const dup = await findDuplicate(supabase, d.company_name, d.fields?.website as string | undefined);
            if (dup) {
              duplicates.push({ company_name: d.company_name, existing_deal_id: dup.id });
              continue;
            }
            rows.push({
              run_id: runId,
              user_id: userId,
              action_type: "create_deal",
              target_table: "deals",
              payload: { company_name: d.company_name, ...(d.fields ?? {}) },
              rationale,
              status: "pending",
            });
          }
          if (rows.length) {
            const { data, error } = await supabase
              .from("agent_actions")
              .insert(rows)
              .select("id");
            if (error) return { error: error.message, duplicates };
            for (const r of data ?? []) proposed.push(r.id as string);
          }
          return { proposed: proposed.length, duplicates, action_ids: proposed };
        },
      }),

      propose_create_tasks_bulk: tool({
        description: "Propose MANY tasks/reminders in one shot. Use for 2+ tasks.",
        inputSchema: z.object({
          tasks: z.array(z.object({
            title: z.string(),
            description: z.string().optional(),
            reminder_date: z.string().describe("YYYY-MM-DD"),
            priority: z.enum(["low", "medium", "high"]).default("medium"),
            deal_id: z.string().uuid().optional(),
            investor_id: z.string().uuid().optional(),
          })).min(1).max(50),
          rationale: z.string(),
        }),
        execute: async ({ tasks, rationale }) => {
          if (!runId) return { error: "No run id" };
          const rows = tasks.map((t) => ({
            run_id: runId,
            user_id: userId,
            action_type: "create_task",
            target_table: "reminders",
            payload: t,
            rationale,
            status: "pending",
          }));
          const { data, error } = await supabase.from("agent_actions").insert(rows).select("id");
          if (error) return { error: error.message };
          return { proposed: data?.length ?? 0, action_ids: (data ?? []).map((r) => r.id) };
        },
      }),

      propose_create_investor: tool({
        description: "Propose creating a new investor record. Lands in the approval queue.",
        inputSchema: z.object({
          contact_name: z.string(),
          fields: z.record(z.string(), z.unknown()).optional().describe(
            "Other columns: firm_name, firm_website, contact_email, contact_phone, location, preferred_sectors (string[]), preferred_investment_stage, average_check_size, linkedin_url, tags (string[])",
          ),
          rationale: z.string(),
        }),
        execute: async ({ contact_name, fields, rationale }) => {
          if (!runId) return { error: "No run id" };
          const payload = { contact_name, ...(fields ?? {}) };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId, user_id: userId,
              action_type: "create_investor", target_table: "investors",
              payload, rationale, status: "pending",
            })
            .select("id").single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),

      propose_update_investor: tool({
        description: "Propose updates to fields on an investor. Lands in the approval queue.",
        inputSchema: z.object({
          investor_id: z.string().uuid(),
          changes: z.record(z.string(), z.unknown()),
          rationale: z.string(),
        }),
        execute: async ({ investor_id, changes, rationale }) => {
          if (!runId) return { error: "No run id" };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId, user_id: userId,
              action_type: "update_investor", target_table: "investors", target_id: investor_id,
              payload: changes, rationale, status: "pending",
            })
            .select("id").single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),

      propose_create_contact: tool({
        description: "Propose creating a new contact. Lands in the approval queue.",
        inputSchema: z.object({
          name: z.string(),
          fields: z.record(z.string(), z.unknown()).optional().describe(
            "Other columns: email, phone, title, company_or_firm, deal_id, investor_id, portfolio_company_id",
          ),
          rationale: z.string(),
        }),
        execute: async ({ name, fields, rationale }) => {
          if (!runId) return { error: "No run id" };
          const payload = { name, ...(fields ?? {}) };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId, user_id: userId,
              action_type: "create_contact", target_table: "contacts",
              payload, rationale, status: "pending",
            })
            .select("id").single();
          if (error) return { error: error.message };
          return { proposed: true, action_id: data.id };
        },
      }),

      propose_update_contact: tool({
        description: "Propose updates to a contact. Lands in the approval queue.",
        inputSchema: z.object({
          contact_id: z.string().uuid(),
          changes: z.record(z.string(), z.unknown()),
          rationale: z.string(),
        }),
        execute: async ({ contact_id, changes, rationale }) => {
          if (!runId) return { error: "No run id" };
          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId, user_id: userId,
              action_type: "update_contact", target_table: "contacts", target_id: contact_id,
              payload: changes, rationale, status: "pending",
            })
            .select("id").single();
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

      list_prompts: tool({
        description:
          "List the agent's editable instruction prompts and playbooks (slug, title, kind). Use BEFORE propose_edit_prompt to find the correct slug.",
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from("agent_prompts")
            .select("slug,kind,title,updated_at")
            .order("sort_order", { ascending: true });
          if (error) return { error: error.message };
          return { count: data?.length ?? 0, prompts: data };
        },
      }),

      get_prompt: tool({
        description: "Fetch the full markdown body of one prompt/playbook by slug. Use before propose_edit_prompt so you can return the full new body.",
        inputSchema: z.object({ slug: z.string() }),
        execute: async ({ slug }) => {
          const { data, error } = await supabase
            .from("agent_prompts")
            .select("slug,kind,title,body,updated_at")
            .eq("slug", slug)
            .maybeSingle();
          if (error) return { error: error.message };
          return data ?? { error: "Not found" };
        },
      }),

      propose_edit_prompt: tool({
        description:
          "Propose an edit to one of your own instruction prompts or playbooks. Lands in the approval queue — nothing changes until approved. Always pass the FULL new markdown body (not a diff). Use list_prompts and get_prompt first to load the current body, then return a modified version.",
        inputSchema: z.object({
          slug: z.string().describe("Existing slug, e.g. prompts/system or playbooks/weekly-review"),
          new_body: z.string().min(10).describe("Full replacement markdown body"),
          change_note: z.string().describe("One-line description of why this change"),
        }),
        execute: async ({ slug, new_body, change_note }) => {
          if (!runId) return { error: "No run id" };
          // Verify slug exists
          const { data: existing, error: lookupErr } = await supabase
            .from("agent_prompts")
            .select("id,body")
            .eq("slug", slug)
            .maybeSingle();
          if (lookupErr) return { error: lookupErr.message };
          if (!existing) return { error: `No prompt with slug "${slug}"` };

          const { data, error } = await supabase
            .from("agent_actions")
            .insert({
              run_id: runId,
              user_id: userId,
              action_type: "edit_prompt",
              target_table: "agent_prompts",
              target_id: existing.id,
              payload: {
                slug,
                new_body,
                change_note,
                old_body: existing.body,
              },
              rationale: change_note,
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
      system: await getSystemPrompt(),
      messages: await convertToModelMessages(trimHistory(messages)),
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
