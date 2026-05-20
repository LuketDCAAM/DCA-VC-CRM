import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { QualitativeRatings, ScorecardInputs } from "@/lib/scorecard/types";
import { buildBenchmarkMap, computeSnapshot } from "@/lib/scorecard/engine";
import { METRIC_KEYS, getDefaultBenchmark } from "@/lib/scorecard/benchmarks";

export interface DealScorecardRow {
  id: string;
  deal_id: string;
  version: number;
  status: "draft" | "approved" | "archived";
  is_current: boolean;
  qualitative_ratings: QualitativeRatings;
  metric_notes: Record<string, string>;
  computed: ReturnType<typeof computeSnapshot> | Record<string, never>;
  blended_score: number | null;
  classification: string | null;
  ai_run_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // narrative
  company_overview: string | null;
  investment_thesis: string | null;
  traction_milestones: string | null;
  business_model: string | null;
  key_strengths: string | null;
  key_risks: string | null;
  investor_base: string | null;
  competitive_landscape: string | null;
  use_of_funds: string | null;
  dca_value_add: string | null;
  // ...all input fields are columns too — kept loose for ease
  [key: string]: unknown;
}

export function inputsFromRow(row: DealScorecardRow | null | undefined): ScorecardInputs {
  if (!row) return {};
  const keys: (keyof ScorecardInputs)[] = [
    "sector","stage","geography","geography_tier","founding_year","deal_lead","vehicle",
    "repeat_founder","has_technical_cofounder","fundraise_amount","valuation","prev_valuation",
    "committed_amount","round_deadline","founder_ownership_pct","bridge_rounds_18mo",
    "total_debt_excl_convertibles","current_arr","prior_arr","forecast_arr","gross_burn",
    "net_burn","cash_balance","total_raised","gross_margin","fcst_gross_margin","acv",
    "employee_count","nrr","grr","top_cust_pct","monthly_churn",
  ];
  const out: ScorecardInputs = {};
  for (const k of keys) (out as Record<string, unknown>)[k] = row[k as string] as unknown;
  return out;
}

export function useDealScorecard(dealId: string) {
  const [row, setRow] = useState<DealScorecardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deal_scorecards")
      .select("*")
      .eq("deal_id", dealId)
      .eq("is_current", true)
      .maybeSingle();
    if (error) toast.error("Failed to load scorecard");
    setRow((data as unknown as DealScorecardRow) ?? null);
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    load();
  }, [load]);

  const benchmarkMap = useMemo(() => {
    const stage = (row as ScorecardInputs | null)?.stage ?? null;
    return buildBenchmarkMap(METRIC_KEYS.map((m) => getDefaultBenchmark(stage, m)));
  }, [row]);

  const ensureDraft = useCallback(async (): Promise<DealScorecardRow | null> => {
    if (row) return row;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      toast.error("Sign in required");
      return null;
    }
    // Pull existing deal values as starting point
    const { data: deal } = await supabase
      .from("deals")
      .select("sector,round_stage,location,country,state_province,city,deal_lead,investment_vehicle,founded_year,round_size,post_money_valuation,revenue,total_funding_raised,description")
      .eq("id", dealId)
      .maybeSingle();

    const seed = deal
      ? {
          sector: deal.sector ?? null,
          stage: deal.round_stage ?? null,
          geography: deal.location ?? ([deal.city, deal.state_province, deal.country].filter(Boolean).join(", ") || null),
          founding_year: deal.founded_year ?? null,
          deal_lead: deal.deal_lead ?? null,
          vehicle: deal.investment_vehicle ?? null,
          fundraise_amount: deal.round_size ?? null,
          valuation: deal.post_money_valuation ?? null,
          current_arr: deal.revenue ?? null,
          total_raised: deal.total_funding_raised ?? null,
          company_overview: deal.description ?? null,
        }
      : {};

    const { data: created, error } = await supabase
      .from("deal_scorecards")
      .insert({ deal_id: dealId, created_by: uid, status: "draft", ...seed })
      .select("*")
      .single();
    if (error) {
      toast.error("Failed to start scorecard");
      return null;
    }
    setRow(created as unknown as DealScorecardRow);
    return created as unknown as DealScorecardRow;
  }, [dealId, row]);

  const save = useCallback(
    async (patch: Partial<DealScorecardRow>) => {
      if (!row) return;
      setSaving(true);
      const inputs = { ...inputsFromRow(row), ...inputsFromRow(patch as DealScorecardRow) };
      const ratings = (patch.qualitative_ratings ?? row.qualitative_ratings ?? {}) as QualitativeRatings;
      const computed = computeSnapshot(inputs, ratings, benchmarkMap);
      const { data, error } = await supabase
        .from("deal_scorecards")
        .update({
          ...(patch as never),
          computed: computed as unknown as never,
          blended_score: computed.blended_score,
          classification: computed.classification,
        })
        .eq("id", row.id)
        .select("*")
        .single();
      setSaving(false);
      if (error) {
        toast.error("Save failed");
        return;
      }
      setRow(data as unknown as DealScorecardRow);
    },
    [row, benchmarkMap],
  );

  const approve = useCallback(async () => {
    if (!row) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    setSaving(true);
    const { data, error } = await supabase
      .from("deal_scorecards")
      .update({ status: "approved", approved_by: uid, approved_at: new Date().toISOString() })
      .eq("id", row.id)
      .select("*")
      .single();
    if (error) {
      setSaving(false);
      toast.error("Approve failed");
      return;
    }
    // Push blended score onto the deal
    if (data && (data as { blended_score?: number }).blended_score != null) {
      await supabase
        .from("deals")
        .update({ deal_score: Math.round(Number((data as { blended_score: number }).blended_score)) })
        .eq("id", dealId);
    }
    setRow(data as unknown as DealScorecardRow);
    setSaving(false);
    toast.success("Scorecard approved");
  }, [row, dealId]);

  return { row, loading, saving, load, ensureDraft, save, approve, benchmarkMap };
}
