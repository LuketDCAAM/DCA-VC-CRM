// Bulk-apply pending agent_actions in a single request.
// Replaces per-row client round-trips for "Approve all".
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  DEAL_COLUMNS,
  INVESTOR_COLUMNS,
  CONTACT_COLUMNS,
  REMINDER_COLUMNS,
  pickAllowed,
  formatPgError,
} from "../_shared/action-schemas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AgentActionRow {
  id: string;
  user_id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  status: string;
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

    // User-scoped client for auth check + row access; service role for cross-table writes.
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.action_ids) ? (body.action_ids as string[]) : [];
    if (ids.length === 0 || ids.length > 200) {
      return new Response(JSON.stringify({ error: "Provide 1-200 action_ids" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all rows in one query, scoped to this user.
    const { data: rows, error: fetchErr } = await service
      .from("agent_actions")
      .select("id,user_id,action_type,target_table,target_id,payload,status")
      .in("id", ids)
      .eq("user_id", userId);
    if (fetchErr) throw fetchErr;

    let ok = 0;
    let failed = 0;
    const failures: { id: string; error: string }[] = [];
    const appliedIds: string[] = [];
    const failedUpdates: { id: string; error: string }[] = [];

    for (const action of (rows ?? []) as AgentActionRow[]) {
      if (action.status !== "pending") continue;
      try {
        await applyOne(service, action, userId);
        appliedIds.push(action.id);
        ok++;
      } catch (e) {
        const msg = formatPgError(e);
        failedUpdates.push({ id: action.id, error: msg });
        failures.push({ id: action.id, error: msg });
        failed++;
      }
    }

    if (appliedIds.length) {
      await service
        .from("agent_actions")
        .update({ status: "applied", applied_at: new Date().toISOString(), error: null })
        .in("id", appliedIds);
    }
    for (const f of failedUpdates) {
      await service.from("agent_actions").update({ status: "failed", error: f.error }).eq("id", f.id);
    }

    return new Response(JSON.stringify({ ok, failed, failures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("apply-actions error", e);
    return new Response(JSON.stringify({ error: formatPgError(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function applyOne(
  // deno-lint-ignore no-explicit-any
  db: any,
  action: AgentActionRow,
  userId: string,
): Promise<void> {
  const raw = (action.payload ?? {}) as Record<string, unknown>;
  switch (action.action_type) {
    case "update_deal": {
      if (!action.target_id) throw new Error("Missing deal id");
      const payload = pickAllowed(raw, DEAL_COLUMNS);
      const { error } = await db.from("deals").update(payload).eq("id", action.target_id);
      if (error) throw error;
      return;
    }
    case "score_deal": {
      if (!action.target_id) throw new Error("Missing deal id");
      const score = (raw as { deal_score?: number }).deal_score;
      const { error } = await db.from("deals").update({ deal_score: score }).eq("id", action.target_id);
      if (error) throw error;
      return;
    }
    case "create_deal": {
      const payload = pickAllowed(raw, DEAL_COLUMNS);
      if (!payload.company_name) throw new Error("company_name is required");
      const { error } = await db.from("deals").insert({
        ...payload,
        created_by: userId,
        relationship_owner: payload.relationship_owner ?? userId,
      });
      if (error) throw error;
      return;
    }
    case "create_investor": {
      const payload = pickAllowed(raw, INVESTOR_COLUMNS);
      const { error } = await db.from("investors").insert({
        ...payload,
        created_by: userId,
        relationship_owner: payload.relationship_owner ?? userId,
      });
      if (error) throw error;
      return;
    }
    case "update_investor": {
      if (!action.target_id) throw new Error("Missing investor id");
      const payload = pickAllowed(raw, INVESTOR_COLUMNS);
      const { error } = await db.from("investors").update(payload).eq("id", action.target_id);
      if (error) throw error;
      return;
    }
    case "create_contact": {
      const payload = pickAllowed(raw, CONTACT_COLUMNS);
      const { error } = await db.from("contacts").insert({
        ...payload,
        created_by: userId,
        relationship_owner: payload.relationship_owner ?? userId,
      });
      if (error) throw error;
      return;
    }
    case "update_contact": {
      if (!action.target_id) throw new Error("Missing contact id");
      const payload = pickAllowed(raw, CONTACT_COLUMNS);
      const { error } = await db.from("contacts").update(payload).eq("id", action.target_id);
      if (error) throw error;
      return;
    }
    case "create_task": {
      const payload = pickAllowed(raw, REMINDER_COLUMNS);
      const { error } = await db.from("reminders").insert({
        ...payload,
        created_by: userId,
        assigned_to: payload.assigned_to ?? userId,
      });
      if (error) throw error;
      return;
    }
    case "draft_email":
      return; // drafts stay on the action row
    case "edit_prompt": {
      const slug = (raw as { slug?: string }).slug;
      const newBody = (raw as { new_body?: string }).new_body;
      const changeNote = (raw as { change_note?: string }).change_note ?? null;
      if (!slug || !newBody) throw new Error("edit_prompt requires slug and new_body");
      const { data: existing, error: lookupErr } = await db
        .from("agent_prompts")
        .select("id,body")
        .eq("slug", slug)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (!existing) throw new Error(`No prompt with slug "${slug}"`);
      // Snapshot previous body
      const { error: histErr } = await db.from("agent_prompt_versions").insert({
        prompt_id: existing.id,
        slug,
        body: existing.body,
        change_note: changeNote,
        created_by: userId,
      });
      if (histErr) throw histErr;
      const { error: updErr } = await db
        .from("agent_prompts")
        .update({ body: newBody, updated_by: userId })
        .eq("id", existing.id);
      if (updErr) throw updErr;
      return;
    }
    default:
      throw new Error(`Unsupported action type: ${action.action_type}`);
  }
}
