// Fill scorecard blanks: ask AI to extract values from call notes + attachments
// for ONLY the fields that are currently empty on the scorecard.
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
  // Optional: restrict fill to only these field keys (and/or qualitative rating categories).
  fields?: string[];
}

// Field catalogue: name -> { type, description }
const NUM_FIELDS: Record<string, string> = {
  founding_year: "Year the company was founded (integer YYYY).",
  fundraise_amount: "Total amount being raised this round, in USD.",
  valuation: "Post-money valuation or cap for current round, in USD.",
  prev_valuation: "Valuation of the previous round, in USD.",
  committed_amount: "Soft/hard committed amount in current round, in USD.",
  founder_ownership_pct: "Founder ownership as a decimal (e.g. 0.45 for 45%).",
  bridge_rounds_18mo: "Number of bridge rounds in last 18 months (integer).",
  total_debt_excl_convertibles: "Total debt excluding convertibles, in USD.",
  current_arr: "Current annual recurring revenue, in USD.",
  prior_arr: "Prior fiscal year ARR, in USD.",
  forecast_arr: "Forecast ARR for current FY, in USD.",
  gross_burn: "Monthly gross burn, in USD per month.",
  net_burn: "Monthly net burn, in USD per month.",
  cash_balance: "Current cash on balance sheet, in USD.",
  total_raised: "Total raised to date across all rounds, in USD.",
  gross_margin: "Gross margin as a decimal (e.g. 0.8 for 80%).",
  fcst_gross_margin: "Forecast gross margin as a decimal.",
  acv: "Annual contract value per customer, in USD.",
  employee_count: "Headcount (integer).",
  nrr: "Net revenue retention as a decimal (e.g. 1.15 for 115%).",
  grr: "Gross revenue retention as a decimal.",
  top_cust_pct: "Top customer concentration as a decimal (share of revenue).",
  monthly_churn: "Monthly logo churn as a decimal.",
};

const TEXT_FIELDS: Record<string, string> = {
  sector: "Sector / industry.",
  stage: "Round stage (Pre-Seed, Seed, Series A, Series B, Series C, Growth).",
  geography: "Headquarters city / country.",
  deal_lead: "Person leading the deal at DCA.",
  vehicle: "Fund vehicle.",
};

const BOOL_FIELDS: Record<string, string> = {
  repeat_founder: "True if any founder has a prior exit / repeat-founder status.",
  has_technical_cofounder: "True if there is a technical co-founder.",
};

const NARRATIVE_FIELDS: Record<string, string> = {
  company_overview: "2-4 sentences describing what the company does.",
  investment_thesis: "Why this is compelling for DCA — 2-4 sentences.",
  traction_milestones: "Concrete traction: revenue, customers, partnerships.",
  business_model: "How they make money.",
  key_strengths: "Top 2-3 unfair advantages.",
  key_risks: "Top 2-3 risks / concerns.",
  investor_base: "Existing and committed investors.",
  competitive_landscape: "Key competitors and differentiation.",
  use_of_funds: "How funds will be deployed.",
  dca_value_add: "Where DCA can add value beyond capital.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
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

    const [{ data: deal }, { data: calls }, { data: dealFiles }, { data: scorecard }, { data: docs }] = await Promise.all([
      admin.from("deals").select("*").eq("id", body.deal_id).maybeSingle(),
      admin.from("call_notes").select("title,call_date,content").eq("deal_id", body.deal_id).order("call_date", { ascending: false }),
      admin.from("file_attachments").select("file_name,file_url,file_type,file_size,created_at").eq("deal_id", body.deal_id).order("created_at", { ascending: false }),
      admin.from("deal_scorecards").select("*").eq("id", body.scorecard_id).maybeSingle(),
      admin.from("scorecard_documents").select("kind,external_url,parsed_excerpt,file:file_attachments(file_name)").eq("scorecard_id", body.scorecard_id),
    ]);

    if (!scorecard) return json({ error: "Scorecard not found" }, 404);

    // Determine blank fields
    const blanks: string[] = [];
    const isBlank = (v: unknown) => v === null || v === undefined || v === "";
    const allFields = { ...NUM_FIELDS, ...TEXT_FIELDS, ...BOOL_FIELDS, ...NARRATIVE_FIELDS };
    const restrict = Array.isArray(body.fields) && body.fields.length > 0 ? new Set(body.fields) : null;
    for (const k of Object.keys(allFields)) {
      if (restrict && !restrict.has(k)) continue;
      if (isBlank((scorecard as Record<string, unknown>)[k])) blanks.push(k);
    }

    // Also fill missing qualitative ratings
    const ratings = (scorecard.qualitative_ratings ?? {}) as Record<string, { score?: number }>;
    const missingRatings: string[] = [];
    for (const c of ["market", "product", "business_model", "team", "exit"]) {
      if (restrict && !restrict.has(`rating:${c}`)) continue;
      if (!ratings[c] || ratings[c].score == null) missingRatings.push(c);
    }

    if (blanks.length === 0 && missingRatings.length === 0) {
      return json({ ok: true, filled: 0, message: "Nothing to fill — all fields already populated." });
    }

    // Build response schema dynamically for only the blank fields
    const properties: Record<string, unknown> = {};
    for (const k of blanks) {
      if (k in NUM_FIELDS) properties[k] = { type: ["number", "null"], description: NUM_FIELDS[k] };
      else if (k in BOOL_FIELDS) properties[k] = { type: ["boolean", "null"], description: BOOL_FIELDS[k] };
      else if (k in TEXT_FIELDS) properties[k] = { type: ["string", "null"], description: TEXT_FIELDS[k] };
      else if (k in NARRATIVE_FIELDS) properties[k] = { type: ["string", "null"], description: NARRATIVE_FIELDS[k] };
    }
    if (missingRatings.length) {
      const ratingProps: Record<string, unknown> = {};
      for (const c of missingRatings) {
        ratingProps[c] = {
          type: ["object", "null"],
          properties: {
            score: { type: "integer", minimum: 1, maximum: 5 },
            rationale: { type: "string" },
          },
        };
      }
      properties.qualitative_ratings = {
        type: "object",
        additionalProperties: false,
        properties: ratingProps,
      };
    }

    const schema = {
      type: "object",
      additionalProperties: false,
      properties,
    };

    const callLines = (calls ?? [])
      .map((c) => `### ${c.title} (${c.call_date})\n${(c.content ?? "").slice(0, 8000)}`)
      .join("\n\n");

    const dealFileLines = (dealFiles ?? [])
      .map((f) => `- ${f.file_name} [${f.file_type ?? "file"}]`)
      .join("\n");

    const sourceLines = (docs ?? [])
      .map((d) => `- [${d.kind}] ${d.file?.file_name ?? d.external_url ?? "(untitled)"}${d.parsed_excerpt ? `\n  Excerpt: ${d.parsed_excerpt.slice(0, 2500)}` : ""}`)
      .join("\n");

    const prompt = [
      `You are a VC analyst filling in blank fields on an investment scorecard for ${deal?.company_name ?? "this company"}.`,
      "",
      "ONLY return values for the fields listed in the schema. For each field, use evidence from the call notes, attachments, and deal record below.",
      "If a field cannot be confidently inferred from the available evidence, return null for that field rather than guessing.",
      "Numeric values must be raw numbers in the requested units (USD or decimal for percentages — e.g. 0.85 for 85%, never '85%').",
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
      "## Existing scorecard (already filled — do not overwrite)",
      JSON.stringify(
        Object.fromEntries(
          Object.entries(scorecard as Record<string, unknown>).filter(
            ([k, v]) => k in allFields && !isBlank(v),
          ),
        ),
        null,
        2,
      ),
      "",
      "## Fields to fill",
      blanks.map((k) => `- ${k}: ${allFields[k]}`).join("\n"),
      missingRatings.length ? `\n## Qualitative ratings to fill (1-5)\n${missingRatings.join(", ")}` : "",
      "",
      "## Sources attached to scorecard",
      sourceLines || "(none)",
      "",
      "## Deal attachments",
      dealFileLines || "(none)",
      "",
      "## Call notes / transcripts",
      callLines || "(none)",
    ].join("\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a rigorous VC analyst. Return null for any field not supported by evidence." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "fill_blanks",
            description: "Fill blank scorecard fields using evidence from notes and attachments.",
            parameters: schema,
          },
        }],
        tool_choice: { type: "function", function: { name: "fill_blanks" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited — try again shortly" }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in Lovable settings." }, 402);
    if (!aiRes.ok) {
      const text = await aiRes.text();
      return json({ error: "AI request failed", details: text.slice(0, 500) }, 502);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "No tool call in AI response" }, 502);

    let draft: Record<string, unknown>;
    try {
      draft = JSON.parse(toolCall.function.arguments);
    } catch {
      return json({ error: "AI returned invalid JSON" }, 502);
    }

    // Apply only to still-blank fields
    const patch: Record<string, unknown> = {};
    let filled = 0;
    for (const k of blanks) {
      const v = draft[k];
      if (v !== null && v !== undefined && v !== "" && isBlank((scorecard as Record<string, unknown>)[k])) {
        patch[k] = v;
        filled++;
      }
    }
    // Merge qualitative ratings
    if (draft.qualitative_ratings && typeof draft.qualitative_ratings === "object") {
      const incoming = draft.qualitative_ratings as Record<string, { score?: number; rationale?: string } | null>;
      const merged: Record<string, unknown> = { ...ratings };
      for (const c of missingRatings) {
        const r = incoming[c];
        if (r && r.score != null) {
          merged[c] = { score: r.score, rationale: r.rationale ?? "" };
          filled++;
        }
      }
      if (Object.keys(merged).length) patch.qualitative_ratings = merged;
    }

    if (filled > 0) {
      await admin.from("deal_scorecards").update(patch).eq("id", body.scorecard_id);
    }

    return json({ ok: true, filled, fields: Object.keys(patch) });
  } catch (e) {
    console.error("fill-scorecard-blanks error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
