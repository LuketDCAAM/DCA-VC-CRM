import { useEffect, useState, useCallback, useRef } from "react";
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

async function callApplyActions(ids: string[]): Promise<{ ok: number; failed: number }> {
  const { data, error } = await supabase.functions.invoke("apply-actions", {
    body: { action_ids: ids },
  });
  if (error) throw error;
  return data as { ok: number; failed: number };
}

export function useAgentActions(filterStatus: AgentAction["status"] | "all" = "pending") {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedStatus, setLoadedStatus] = useState<typeof filterStatus>(filterStatus);
  const requestId = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    let q = supabase
      .from("agent_actions")
      .select("id,run_id,action_type,target_table,target_id,payload,rationale,status,created_at,applied_at,error")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    const { data, error: queryError } = await q;
    if (currentRequest !== requestId.current) return;
    if (queryError) {
      const msg = formatError(queryError);
      console.error("agent actions refresh failed:", msg, queryError);
      setActions([]);
      setError(msg);
      setLoadedStatus(filterStatus);
      setLoading(false);
      return;
    }
    setActions((data ?? []) as AgentAction[]);
    setLoadedStatus(filterStatus);
    setError(null);
    setLoading(false);
  }, [filterStatus]);

  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      refresh();
    }, 250);
  }, [refresh]);

  useEffect(() => {
    setActions([]);
    setError(null);
    setLoading(true);
    refresh();
    const channel = supabase
      .channel(`agent_actions_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_actions" },
        () => debouncedRefresh(),
      )
      .subscribe();
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [refresh, debouncedRefresh]);

  const apply = async (action: AgentAction) => {
    try {
      await callApplyActions([action.id]);
    } catch (e) {
      const msg = formatError(e);
      console.error("apply action failed:", action.id, msg, e);
      await supabase
        .from("agent_actions")
        .update({ status: "failed", error: msg })
        .eq("id", action.id);
    }
  };

  const applyMany = async (ids: string[]) => {
    if (ids.length === 0) return { ok: 0, failed: 0 };
    try {
      return await callApplyActions(ids);
    } catch (e) {
      const msg = formatError(e);
      console.error("bulk apply failed:", msg, e);
      return { ok: 0, failed: ids.length };
    }
  };

  const reject = async (action: AgentAction) => {
    await supabase.from("agent_actions").update({ status: "rejected" }).eq("id", action.id);
  };

  const rejectMany = async (ids: string[]) => {
    if (ids.length === 0) return { ok: 0, failed: 0 };
    const { error } = await supabase.from("agent_actions").update({ status: "rejected" }).in("id", ids);
    if (error) return { ok: 0, failed: ids.length };
    return { ok: ids.length, failed: 0 };
  };

  const retry = async (action: AgentAction) => {
    await supabase
      .from("agent_actions")
      .update({ status: "pending", error: null })
      .eq("id", action.id);
    await apply({ ...action, status: "pending", error: null });
  };

  const visibleActions = loadedStatus === filterStatus ? actions : [];
  const visibleLoading = loading || loadedStatus !== filterStatus;

  return { actions: visibleActions, loading: visibleLoading, error, refresh, apply, applyMany, reject, rejectMany, retry };
}
