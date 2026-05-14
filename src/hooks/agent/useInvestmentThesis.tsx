import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InvestmentThesis {
  id: string;
  sectors: string[];
  stages: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  geographies: string[];
  business_models: string[];
  must_haves: string[];
  deal_breakers: string[];
  weight_sector_fit: number;
  weight_stage_fit: number;
  weight_traction: number;
  weight_team: number;
  weight_market: number;
  narrative: string | null;
  notion_transcripts_db_id: string | null;
  auto_run_on_create: boolean;
}

export function useInvestmentThesis() {
  const [thesis, setThesis] = useState<InvestmentThesis | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("investment_thesis")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setThesis(data as InvestmentThesis | null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async (patch: Partial<InvestmentThesis>) => {
    if (!thesis) return { error: "No thesis row" };
    const { error } = await supabase
      .from("investment_thesis")
      .update(patch)
      .eq("id", thesis.id);
    if (!error) await refresh();
    return { error };
  };

  return { thesis, loading, refresh, save };
}
