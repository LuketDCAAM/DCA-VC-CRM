// Shared types for the DCA Investment Scorecard.
// Mirrors the columns of public.deal_scorecards and the workbook structure.

export type ScoreBand = "HIGHLY ATTRACTIVE" | "MODERATE FIT" | "BELOW THRESHOLD" | "NO FIT";

export interface ScorecardInputs {
  // Company info
  sector?: string | null;
  stage?: string | null;
  geography?: string | null;
  geography_tier?: string | null;
  founding_year?: number | null;
  deal_lead?: string | null;
  vehicle?: string | null;
  repeat_founder?: boolean | null;
  has_technical_cofounder?: boolean | null;

  // Round
  fundraise_amount?: number | null;
  valuation?: number | null;
  prev_valuation?: number | null;
  committed_amount?: number | null;
  round_deadline?: string | null;
  founder_ownership_pct?: number | null; // 0-1
  bridge_rounds_18mo?: number | null;
  total_debt_excl_convertibles?: number | null;

  // Financial / operating
  current_arr?: number | null;
  prior_arr?: number | null;
  forecast_arr?: number | null;
  gross_burn?: number | null;
  net_burn?: number | null;
  cash_balance?: number | null;
  total_raised?: number | null;
  gross_margin?: number | null; // 0-1
  fcst_gross_margin?: number | null;
  acv?: number | null;
  employee_count?: number | null;
  nrr?: number | null;
  grr?: number | null;
  top_cust_pct?: number | null;
  monthly_churn?: number | null;
}

export interface QualitativeRating {
  score?: number | null; // 1-5
  rationale?: string;
  source?: string; // 'deck:p4' | 'transcript' | 'web' | 'manual'
}

export interface QualitativeRatings {
  market?: QualitativeRating;
  product?: QualitativeRating;
  business_model?: QualitativeRating;
  team?: QualitativeRating;
  exit?: QualitativeRating;
}

export interface AutoCalcs {
  ev_revenue: number | null;
  runway_months: number | null;
  arr_per_employee: number | null;
  burn_to_round: number | null;
  implied_dilution: number | null;
  burn_multiple: number | null;
  company_age: number | null;
  annual_growth: number | null;
  mom_growth: number | null;
}

export interface MetricLine {
  metric: string;
  label: string;
  value: number | null;
  benchmark: number | null;
  variance: number | null; // (value-bench)/bench, inverted handled
  tier: number; // 0-5
  weight: number; // 0-1
  weighted_score: number; // 0-25 contribution
  inverted: boolean;
}

export interface HardStopResult {
  key: string;
  rule: string;
  data: string;
  failed: boolean;
}

export interface RiskFlag {
  key: string;
  type: "RED" | "YLW";
  risk: string;
  check: string;
  status: "PASS" | "FLAG" | "N/A" | "MANUAL";
}

export interface ComputedSnapshot {
  autocalcs: AutoCalcs;
  metrics: MetricLine[];
  qual_total: number; // /25
  quant_total: number; // /25
  qual_score: number; // qual_total * 2.4 (so /60)
  quant_score: number; // quant_total * 1.6 (so /40)
  blended_score: number; // /100
  classification: ScoreBand;
  hard_stops: HardStopResult[];
  hard_stop_failed: boolean;
  risk_flags: RiskFlag[];
  red_flag_count: number;
  yellow_flag_count: number;
}

export interface Benchmark {
  metric: string;
  target_value: number | null;
  weight: number;
  inverted: boolean;
}
