// Writes a personalized outreach email draft for a follow-up or an investor digest item.
// Context comes from the CRM (deal, notes, scorecard, investor focus) and the house-style template.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { corsHeaders } from "../_shared/cors.ts";
import { callSingleTool } from "../_shared/ai-provider.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string", description: "Email subject line, under 70 characters." },
    body: { type: "string", description: "Plain-text email body including greeting and sign-off." },
  },
  required: ["subject", "body"],
} as const;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function money(cents: number | null | undefined) {
  if (cents === null || cents === undefined) return null;
  const n = Number(cents);
  if (!Number.isFinite(n)) return null;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

// deno-lint-ignore no-explicit-any
async function dealContext(admin: any, dealId: string) {
  const { data: deal } = await admin.from("deals").select("*").eq("id", dealId).maybeSingle();
  if (!deal) return "";

  const { data: notes } = await admin
    .from("call_notes")
    .select("title, content, call_date")
    .eq("deal_id", dealId)
    .order("call_date", { ascending: false })
    .limit(4);

  const { data: scorecards } = await admin
    .from("deal_scorecards")
    .select("company_overview, investment_thesis, traction_milestones, key_strengths, key_risks, current_arr, prior_arr, net_burn, blended_score, classification")
    .eq("deal_id", dealId)
    .eq("is_current", true)
    .limit(1);
  const sc = scorecards?.[0];

  const lines: string[] = [
    `Company: ${deal.company_name}`,
    deal.sector ? `Sector: ${deal.sector}` : "",
    deal.round_stage ? `Round stage: ${deal.round_stage}` : "",
    deal.pipeline_stage ? `Our pipeline stage: ${deal.pipeline_stage}` : "",
    deal.round_size ? `Round size: ${money(deal.round_size)}` : "",
    deal.post_money_valuation ? `Post-money valuation: ${money(deal.post_money_valuation)}` : "",
    deal.revenue ? `Revenue: ${money(deal.revenue)}` : "",
    deal.description ? `Description: ${deal.description}` : "",
    deal.next_steps ? `Agreed next steps: ${deal.next_steps}` : "",
    deal.last_call_date ? `Last call: ${deal.last_call_date}` : "",
    deal.contact_name ? `Primary contact: ${deal.contact_name}` : "",
  ].filter(Boolean);

  if (sc) {
    lines.push("--- Scorecard highlights ---");
    if (sc.company_overview) lines.push(`Overview: ${String(sc.company_overview).slice(0, 900)}`);
    if (sc.investment_thesis) lines.push(`Our thesis: ${String(sc.investment_thesis).slice(0, 900)}`);
    if (sc.traction_milestones) lines.push(`Traction: ${String(sc.traction_milestones).slice(0, 900)}`);
    if (sc.key_strengths) lines.push(`Strengths: ${String(sc.key_strengths).slice(0, 600)}`);
    if (sc.key_risks) lines.push(`Open questions/risks: ${String(sc.key_risks).slice(0, 600)}`);
    if (sc.current_arr) lines.push(`Current ARR: ${sc.current_arr}`);
    if (sc.prior_arr) lines.push(`Prior ARR: ${sc.prior_arr}`);
  }

  if (notes?.length) {
    lines.push("--- Recent call notes (most recent first) ---");
    // deno-lint-ignore no-explicit-any
    notes.forEach((n: any) => {
      lines.push(`[${n.call_date}] ${n.title ?? "Call"}: ${String(n.content ?? "").slice(0, 2500)}`);
    });
  }

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY") ?? SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const target = body.target as "follow_up" | "batch_item";
    const id = body.id as string;
    const regenerateNote = (body.regenerate_note as string | null) ?? null;
    if (!id || (target !== "follow_up" && target !== "batch_item")) {
      return json({ error: "Provide target ('follow_up' or 'batch_item') and id" }, 400);
    }

    let purpose = "check_in";
    let contextBlocks: string[] = [];
    let recipientLabel = "the founder";
    let ownerId = user.id;

    if (target === "follow_up") {
      const { data: row, error } = await admin
        .from("outreach_follow_ups")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row) return json({ error: "Follow-up not found" }, 404);
      if (row.owner_id !== user.id && row.created_by !== user.id) return json({ error: "Not your follow-up" }, 403);

      purpose = row.purpose || "check_in";
      ownerId = row.owner_id;
      recipientLabel = row.contact_name || "the founder";

      if (row.deal_id) contextBlocks.push(await dealContext(admin, row.deal_id));
      if (row.investor_id) {
        const { data: inv } = await admin.from("investors").select("*").eq("id", row.investor_id).maybeSingle();
        if (inv) {
          recipientLabel = row.contact_name || inv.contact_name || recipientLabel;
          contextBlocks.push(
            [
              `Investor: ${inv.contact_name}${inv.firm_name ? ` (${inv.firm_name})` : ""}`,
              inv.preferred_sectors?.length ? `Their focus: ${inv.preferred_sectors.join(", ")}` : "",
              inv.preferred_investment_stage ? `Their stage: ${inv.preferred_investment_stage}` : "",
              inv.last_call_date ? `Last spoke: ${inv.last_call_date}` : "",
            ].filter(Boolean).join("\n"),
          );
        }
      }
      if (row.context) contextBlocks.push(`Extra context from the sender: ${row.context}`);
      if (regenerateNote) contextBlocks.push(`Revision request: ${regenerateNote}`);
      await admin.from("outreach_follow_ups").update({ status: "drafting" }).eq("id", id);
    } else {
      const { data: row, error } = await admin
        .from("outreach_batch_items")
        .select("*, outreach_batches(period_month, title, intro_note)")
        .eq("id", id)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!row) return json({ error: "Digest item not found" }, 404);
      if (row.owner_id !== user.id && row.created_by !== user.id) return json({ error: "Not your digest item" }, 403);

      purpose = "investor_digest";
      ownerId = row.owner_id;

      const { data: inv } = await admin.from("investors").select("*").eq("id", row.investor_id).maybeSingle();
      recipientLabel = inv?.contact_name || "the investor";
      if (inv) {
        contextBlocks.push(
          [
            `Investor: ${inv.contact_name}${inv.firm_name ? ` (${inv.firm_name})` : ""}`,
            inv.preferred_sectors?.length ? `Their focus: ${inv.preferred_sectors.join(", ")}` : "",
            inv.preferred_investment_stage ? `Their stage: ${inv.preferred_investment_stage}` : "",
            inv.average_check_size ? `Typical check: ${money(inv.average_check_size)}` : "",
            inv.location ? `Based in: ${inv.location}` : "",
          ].filter(Boolean).join("\n"),
        );
      }

      const rationale = (row.match_rationale ?? {}) as Record<string, string>;
      const dealIds = (row.deal_ids ?? []) as string[];
      for (const dealId of dealIds) {
        const ctx = await dealContext(admin, dealId);
        const why = rationale[dealId] ? `\nWhy this investor: ${rationale[dealId]}` : "";
        contextBlocks.push(`--- DEAL ---\n${ctx}${why}`);
      }
      // deno-lint-ignore no-explicit-any
      const batch = (row as any).outreach_batches;
      if (batch?.intro_note) contextBlocks.push(`Sender's note for this month: ${batch.intro_note}`);
      if (regenerateNote) contextBlocks.push(`Revision request: ${regenerateNote}`);
      await admin.from("outreach_batch_items").update({ status: "drafting" }).eq("id", id);
    }

    const { data: template } = await admin
      .from("outreach_templates")
      .select("label, tone, instructions")
      .eq("purpose", purpose)
      .maybeSingle();

    const { data: profile } = await admin.from("profiles").select("name, email").eq("id", ownerId).maybeSingle();
    const senderName = profile?.name || "";

    const system = [
      "You write email drafts for a venture capital firm's investment team.",
      "You write as the named sender, in first person, ready to send with no placeholders.",
      "Never invent metrics, dates, names or commitments that are not in the context.",
      "If a detail is missing, write around it rather than guessing.",
      "Plain text only: no markdown, no bullet characters, no subject line inside the body.",
      `Tone: ${template?.tone || "warm, concise, professional"}.`,
      template?.instructions ? `House style for this email type: ${template.instructions}` : "",
    ].filter(Boolean).join("\n");

    const userPrompt = [
      `Email type: ${template?.label || purpose}`,
      `Sender: ${senderName || "the sender"}`,
      `Recipient: ${recipientLabel}`,
      "",
      "CRM CONTEXT:",
      contextBlocks.filter(Boolean).join("\n\n"),
      "",
      `Write the subject and body. Sign off as ${senderName || "the sender"}.`,
    ].join("\n");

    const result = await callSingleTool({
      userId: user.id,
      system,
      user: userPrompt,
      toolName: "write_email",
      toolDescription: "Return the drafted email subject and body.",
      parameters: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
    });

    const subject = String(result.args.subject ?? "").trim();
    const emailBody = String(result.args.body ?? "").trim();
    if (!subject || !emailBody) return json({ error: "The model returned an empty draft" }, 502);

    const patch = {
      subject,
      body: emailBody,
      status: "drafted",
      drafted_at: new Date().toISOString(),
      regenerate_note: regenerateNote,
      sync_status: "pending",
      sync_error: null,
    };

    const table = target === "follow_up" ? "outreach_follow_ups" : "outreach_batch_items";
    const { error: updateError } = await admin.from(table).update(patch).eq("id", id);
    if (updateError) return json({ error: updateError.message }, 500);

    return json({ subject, body: emailBody, provider: result.provider, model: result.modelId });
  } catch (error) {
    console.error("outreach-draft error:", error);
    return json({ error: (error as Error).message || "Internal server error" }, 500);
  }
});
