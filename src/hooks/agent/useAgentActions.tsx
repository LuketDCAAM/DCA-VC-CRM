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
      .channel("agent_actions_changes")
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
      if (action.action_type === "update_deal" && action.target_id) {
        const { error } = await supabase
          .from("deals")
          .update(action.payload as never)
          .eq("id", action.target_id);
        if (error) throw error;
      } else if (action.action_type === "score_deal" && action.target_id) {
        const { error } = await supabase
          .from("deals")
          .update({ deal_score: (action.payload as { deal_score: number }).deal_score })
          .eq("id", action.target_id);
        if (error) throw error;
      } else if (action.action_type === "create_task") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");
        const { error } = await supabase
          .from("reminders")
          .insert({ ...(action.payload as Record<string, unknown>), created_by: user.id, assigned_to: user.id } as never);
        if (error) throw error;
      } else if (action.action_type === "draft_email") {
        // Drafts are stored in the action itself; future Phase 4 will send via edge fn.
      }
      await supabase
        .from("agent_actions")
        .update({ status: "applied", applied_at: new Date().toISOString() })
        .eq("id", action.id);
    } catch (e) {
      await supabase
        .from("agent_actions")
        .update({ status: "failed", error: String(e) })
        .eq("id", action.id);
    }
  };

  const reject = async (action: AgentAction) => {
    await supabase.from("agent_actions").update({ status: "rejected" }).eq("id", action.id);
  };

  return { actions, loading, refresh, apply, reject };
}
