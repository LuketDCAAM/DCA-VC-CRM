import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgentAction {
  id: string;
  run_id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  rationale: string | null;
  status: "pending" | "approved" | "applied" | "rejected" | "failed";
  created_at: string;
  applied_at: string | null;
  error: string | null;
}

// Allow-lists per target table — strips any junk fields the model invents
const DEAL_COLUMNS = new Set([
  "company_name", "description", "sector", "pipeline_stage", "round_stage",
  "round_size", "post_money_valuation", "revenue", "website", "linkedin_url",
  "crunchbase_url", "location", "city", "state_province", "country",
  "headquarters_location", "contact_name", "contact_email", "contact_phone",
  "deal_source", "source_date", "deal_lead", "next_steps", "tags",
  "founded_year", "employee_count_range", "company_type", "investment_vehicle",
  "ic_review_date", "last_call_date", "last_funding_date", "total_funding_raised",
  "reason_for_passing", "deal_score", "is_priority_deal", "priority_rank",
  "relationship_owner",
]);

const INVESTOR_COLUMNS = new Set([
  "contact_name", "firm_name", "firm_website", "contact_email", "contact_phone",
  "location", "city", "state_province", "country", "preferred_sectors",
  "preferred_investment_stage", "average_check_size", "linkedin_url", "tags",
  "last_call_date", "relationship_owner",
]);

const CONTACT_COLUMNS = new Set([
  "name", "email", "phone", "title", "company_or_firm", "deal_id",
  "investor_id", "portfolio_company_id", "relationship_owner",
]);

const REMINDER_COLUMNS = new Set([
  "title", "description", "reminder_date", "priority", "task_type",
  "deal_id", "investor_id", "portfolio_company_id", "assigned_to",
  "send_email_reminder", "status",
]);

function pickAllowed(payload: Record<string, unknown>, allowed: Set<string>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (allowed.has(k) && v !== undefined && v !== "") out[k] = v;
  }
  return out;
}

function formatError(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  const obj = e as Record<string, unknown>;
  const parts = [obj.message, obj.details, obj.hint, obj.code]
    .filter(Boolean)
    .map(String);
  if (parts.length) return parts.join(" — ");
  try { return JSON.stringify(e); } catch { return String(e); }
}

export function useAgentActions(filterStatus: AgentAction["status"] | "all" = "pending") {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    let q = supabase
      .from("agent_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    const { data } = await q;
    setActions((data ?? []) as AgentAction[]);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`agent_actions_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_actions" },
        () => refresh(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const apply = async (action: AgentAction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const raw = action.payload as Record<string, unknown>;

      if (action.action_type === "update_deal" && action.target_id) {
        const payload = pickAllowed(raw, DEAL_COLUMNS);
        const { error } = await supabase.from("deals").update(payload as never).eq("id", action.target_id);
        if (error) throw error;
      } else if (action.action_type === "score_deal" && action.target_id) {
        const { error } = await supabase
          .from("deals")
          .update({ deal_score: (raw as { deal_score: number }).deal_score })
          .eq("id", action.target_id);
        if (error) throw error;
      } else if (action.action_type === "create_deal") {
        const payload = pickAllowed(raw, DEAL_COLUMNS);
        if (!payload.company_name) throw new Error("company_name is required");
        const { error } = await supabase
          .from("deals")
          .insert({ ...payload, created_by: user.id, relationship_owner: payload.relationship_owner ?? user.id } as never);
        if (error) throw error;
      } else if (action.action_type === "create_investor") {
        const payload = pickAllowed(raw, INVESTOR_COLUMNS);
        const { error } = await supabase
          .from("investors")
          .insert({ ...payload, created_by: user.id, relationship_owner: payload.relationship_owner ?? user.id } as never);
        if (error) throw error;
      } else if (action.action_type === "update_investor" && action.target_id) {
        const payload = pickAllowed(raw, INVESTOR_COLUMNS);
        const { error } = await supabase.from("investors").update(payload as never).eq("id", action.target_id);
        if (error) throw error;
      } else if (action.action_type === "create_contact") {
        const payload = pickAllowed(raw, CONTACT_COLUMNS);
        const { error } = await supabase
          .from("contacts")
          .insert({ ...payload, created_by: user.id, relationship_owner: payload.relationship_owner ?? user.id } as never);
        if (error) throw error;
      } else if (action.action_type === "update_contact" && action.target_id) {
        const payload = pickAllowed(raw, CONTACT_COLUMNS);
        const { error } = await supabase.from("contacts").update(payload as never).eq("id", action.target_id);
        if (error) throw error;
      } else if (action.action_type === "create_task") {
        const payload = pickAllowed(raw, REMINDER_COLUMNS);
        const { error } = await supabase
          .from("reminders")
          .insert({ ...payload, created_by: user.id, assigned_to: payload.assigned_to ?? user.id } as never);
        if (error) throw error;
      } else if (action.action_type === "draft_email") {
        // Drafts stay on the action row; Phase 4 will send via edge fn.
      } else {
        throw new Error(`Unsupported action type: ${action.action_type}`);
      }
      await supabase
        .from("agent_actions")
        .update({ status: "applied", applied_at: new Date().toISOString(), error: null })
        .eq("id", action.id);
    } catch (e) {
      const msg = formatError(e);
      console.error("apply action failed:", action.id, msg, e);
      await supabase
        .from("agent_actions")
        .update({ status: "failed", error: msg })
        .eq("id", action.id);
    }
  };

  const reject = async (action: AgentAction) => {
    await supabase.from("agent_actions").update({ status: "rejected" }).eq("id", action.id);
  };

  const retry = async (action: AgentAction) => {
    await supabase
      .from("agent_actions")
      .update({ status: "pending", error: null })
      .eq("id", action.id);
    await apply({ ...action, status: "pending", error: null });
  };

  return { actions, loading, refresh, apply, reject, retry };
}
