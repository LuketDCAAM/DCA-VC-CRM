import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnalystRun {
  id: string;
  deal_id: string;
  trigger: string;
  status: "running" | "completed" | "failed";
  score: number | null;
  rubric: Record<string, unknown> | null;
  summary: string | null;
  key_findings: string[] | null;
  sources: Array<{ url: string; title?: string }> | null;
  proposed_actions: Array<{ id: string; action_type: string; rationale: string; payload: Record<string, unknown>; status: string }> | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useAnalystRuns(dealId?: string) {
  const [runs, setRuns] = useState<AnalystRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const refresh = useCallback(async () => {
    if (!dealId) { setLoading(false); return; }
    const { data } = await supabase
      .from("analyst_runs")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(10);
    setRuns((data ?? []) as unknown as AnalystRun[]);
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    refresh();
    if (!dealId) return;
    const ch = supabase
      .channel(`analyst_runs_${dealId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "analyst_runs", filter: `deal_id=eq.${dealId}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dealId, refresh]);

  const runAnalyst = async (trigger: "manual" | "auto" = "manual") => {
    if (!dealId) return { error: "No deal" };
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyst-run", {
        body: { dealId, trigger },
      });
      if (error) return { error: error.message };
      await refresh();
      return { data };
    } finally {
      setRunning(false);
    }
  };

  return { runs, latest: runs[0] ?? null, loading, running, refresh, runAnalyst };
}
