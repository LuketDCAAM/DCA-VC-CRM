import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AgentAction } from "./useAgentActions";

/**
 * Fetch a set of agent_actions by id and keep them live via realtime.
 * Used for inline approval cards rendered under chat messages.
 */
export function useActionsByIds(ids: string[]) {
  const [actions, setActions] = useState<Record<string, AgentAction>>({});
  const [loading, setLoading] = useState(true);
  const key = ids.slice().sort().join(",");
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const refresh = useCallback(async () => {
    if (ids.length === 0) {
      setActions({});
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("agent_actions")
      .select("id,run_id,action_type,target_table,target_id,payload,rationale,status,created_at,applied_at,error")
      .in("id", ids);
    if (!error && data) {
      const map: Record<string, AgentAction> = {};
      for (const row of data as AgentAction[]) map[row.id] = row;
      setActions(map);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    refresh();
    if (ids.length === 0) return;
    const channel = supabase
      .channel(`actions_by_ids_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_actions" },
        (payload) => {
          const row = payload.new as AgentAction;
          if (idsRef.current.includes(row.id)) {
            setActions((prev) => ({ ...prev, [row.id]: row }));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refresh]);

  const list = ids.map((id) => actions[id]).filter(Boolean) as AgentAction[];
  return { actions: list, loading, refresh };
}
