import type { Benchmark } from "./types";

// Default benchmarks ported from the DCA workbook.
// Used when no admin-overridden row exists in scorecard_benchmarks for (sector,stage,metric).
// Stage-keyed; sector falls back to "default".

type StageBenchmarks = Record<string, Record<string, Omit<Benchmark, "metric">>>;

const DEFAULTS: StageBenchmarks = {
  "Pre-Seed": {
    ev_revenue: { target_value: 15, weight: 0.15, inverted: true },
    current_arr: { target_value: 100_000, weight: 0.15, inverted: false },
    annual_growth: { target_value: 2.0, weight: 0.15, inverted: false },
    net_burn: { target_value: 50_000, weight: 0.1, inverted: true },
    runway_months: { target_value: 18, weight: 0.1, inverted: false },
    gross_margin: { target_value: 0.6, weight: 0.1, inverted: false },
    fcst_gross_margin: { target_value: 0.7, weight: 0.05, inverted: false },
    acv: { target_value: 10_000, weight: 0.05, inverted: false },
    nrr: { target_value: 1.0, weight: 0.05, inverted: false },
    grr: { target_value: 0.85, weight: 0.05, inverted: false },
    top_cust_pct: { target_value: 0.4, weight: 0.05, inverted: true },
  },
  Seed: {
    ev_revenue: { target_value: 20, weight: 0.15, inverted: true },
    current_arr: { target_value: 500_000, weight: 0.15, inverted: false },
    annual_growth: { target_value: 2.0, weight: 0.15, inverted: false },
    net_burn: { target_value: 150_000, weight: 0.1, inverted: true },
    runway_months: { target_value: 18, weight: 0.1, inverted: false },
    gross_margin: { target_value: 0.65, weight: 0.1, inverted: false },
    fcst_gross_margin: { target_value: 0.75, weight: 0.05, inverted: false },
    acv: { target_value: 25_000, weight: 0.05, inverted: false },
    nrr: { target_value: 1.1, weight: 0.05, inverted: false },
    grr: { target_value: 0.9, weight: 0.05, inverted: false },
    top_cust_pct: { target_value: 0.3, weight: 0.05, inverted: true },
  },
  "Series A": {
    ev_revenue: { target_value: 15, weight: 0.15, inverted: true },
    current_arr: { target_value: 3_000_000, weight: 0.15, inverted: false },
    annual_growth: { target_value: 1.5, weight: 0.15, inverted: false },
    net_burn: { target_value: 400_000, weight: 0.1, inverted: true },
    runway_months: { target_value: 18, weight: 0.1, inverted: false },
    gross_margin: { target_value: 0.7, weight: 0.1, inverted: false },
    fcst_gross_margin: { target_value: 0.78, weight: 0.05, inverted: false },
    acv: { target_value: 50_000, weight: 0.05, inverted: false },
    nrr: { target_value: 1.15, weight: 0.05, inverted: false },
    grr: { target_value: 0.9, weight: 0.05, inverted: false },
    top_cust_pct: { target_value: 0.25, weight: 0.05, inverted: true },
  },
};

DEFAULTS["default"] = DEFAULTS["Seed"];

export function getDefaultBenchmark(stage: string | null | undefined, metric: string): Benchmark {
  const stageKey = stage && DEFAULTS[stage] ? stage : "default";
  const b = DEFAULTS[stageKey][metric];
  if (!b) return { metric, target_value: null, weight: 0, inverted: false };
  return { metric, ...b };
}

export const METRIC_LABELS: Record<string, string> = {
  ev_revenue: "EV / Revenue",
  current_arr: "Current ARR",
  annual_growth: "Annual Growth",
  net_burn: "Net Burn ($/mo)",
  runway_months: "Runway (months)",
  gross_margin: "Gross Margin",
  fcst_gross_margin: "Forecasted GM",
  acv: "ACV",
  nrr: "NRR",
  grr: "GRR",
  top_cust_pct: "Customer Concentration",
};

export const METRIC_KEYS = Object.keys(METRIC_LABELS);
