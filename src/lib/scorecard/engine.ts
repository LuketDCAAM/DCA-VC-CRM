import type {
  AutoCalcs,
  Benchmark,
  ComputedSnapshot,
  HardStopResult,
  MetricLine,
  QualitativeRatings,
  RiskFlag,
  ScoreBand,
  ScorecardInputs,
} from "./types";
import { METRIC_KEYS, METRIC_LABELS, getDefaultBenchmark } from "./benchmarks";

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function computeAutoCalcs(inp: ScorecardInputs): AutoCalcs {
  const arr = num(inp.current_arr);
  const prior = num(inp.prior_arr);
  const fc = num(inp.forecast_arr);
  const val = num(inp.valuation);
  const fund = num(inp.fundraise_amount);
  const netBurn = num(inp.net_burn);
  const cash = num(inp.cash_balance);
  const emp = num(inp.employee_count);
  const founded = num(inp.founding_year);

  const ev_revenue = arr && arr > 0 && val ? val / arr : null;
  const runway_months = netBurn && netBurn > 0 && cash != null ? cash / netBurn : null;
  const arr_per_employee = arr && emp && emp > 0 ? arr / emp : null;
  const burn_to_round = netBurn && fund && fund > 0 ? (netBurn * 12) / fund : null;
  const implied_dilution = fund && val && val > 0 ? fund / (val + fund) : null;
  const annual_growth = prior && prior > 0 && arr ? arr / prior - 1 : null;
  const mom_growth = annual_growth != null ? Math.pow(1 + annual_growth, 1 / 12) - 1 : null;
  const burn_multiple = arr && prior && netBurn && arr - prior > 0 ? (netBurn * 12) / (arr - prior) : null;
  const company_age = founded ? new Date().getFullYear() - founded : null;

  return {
    ev_revenue,
    runway_months,
    arr_per_employee,
    burn_to_round,
    implied_dilution,
    burn_multiple,
    company_age,
    annual_growth,
    mom_growth,
  };
}

// Tier 0 = no data, 1-5 from variance buckets (workbook rule).
export function tierFromVariance(variance: number | null): number {
  if (variance == null || !Number.isFinite(variance)) return 0;
  if (variance > 0.25) return 5;
  if (variance > 0.1) return 4;
  if (variance >= -0.1) return 3;
  if (variance >= -0.25) return 2;
  return 1;
}

function valueForMetric(inp: ScorecardInputs, auto: AutoCalcs, metric: string): number | null {
  switch (metric) {
    case "ev_revenue":
      return auto.ev_revenue;
    case "runway_months":
      return auto.runway_months;
    case "annual_growth":
      return num(inp.current_arr) && num(inp.prior_arr) ? auto.annual_growth : null;
    case "current_arr":
      return num(inp.current_arr);
    case "net_burn":
      return num(inp.net_burn);
    case "gross_margin":
      return num(inp.gross_margin);
    case "fcst_gross_margin":
      return num(inp.fcst_gross_margin);
    case "acv":
      return num(inp.acv);
    case "nrr":
      return num(inp.nrr);
    case "grr":
      return num(inp.grr);
    case "top_cust_pct":
      return num(inp.top_cust_pct);
    default:
      return null;
  }
}

export function computeMetrics(
  inp: ScorecardInputs,
  benchmarks: Map<string, Benchmark>,
): { metrics: MetricLine[]; quant_total: number } {
  const auto = computeAutoCalcs(inp);
  const lines: MetricLine[] = [];

  for (const metric of METRIC_KEYS) {
    const b = benchmarks.get(metric) ?? getDefaultBenchmark(inp.stage, metric);
    const value = valueForMetric(inp, auto, metric);
    let variance: number | null = null;
    if (value != null && b.target_value != null && b.target_value !== 0) {
      const raw = (value - b.target_value) / b.target_value;
      variance = b.inverted ? -raw : raw;
    }
    const tier = tierFromVariance(variance);
    // Top-cust concentration is always weighted at full (workbook hardcodes tier=5)
    const weighted_score = tier > 0 ? b.weight * tier * 5 : 0;
    lines.push({
      metric,
      label: METRIC_LABELS[metric],
      value,
      benchmark: b.target_value,
      variance,
      tier,
      weight: b.weight,
      weighted_score,
      inverted: b.inverted,
    });
  }

  // Customer concentration always counts (workbook forces tier 5 to 25 contribution),
  // so if no data fall back to 25 * weight contribution from a manual 5.
  const quant_total = Math.min(25, lines.reduce((s, l) => s + l.weighted_score, 0));
  return { metrics: lines, quant_total };
}

export function computeQualitativeTotal(r: QualitativeRatings): number {
  const keys: (keyof QualitativeRatings)[] = ["market", "product", "business_model", "team", "exit"];
  return keys.reduce((s, k) => s + (num(r[k]?.score) ?? 0), 0);
}

export function classify(blended: number): ScoreBand {
  if (blended >= 80) return "HIGHLY ATTRACTIVE";
  if (blended >= 56) return "MODERATE FIT";
  if (blended >= 32) return "BELOW THRESHOLD";
  return "NO FIT";
}

export function evaluateHardStops(inp: ScorecardInputs, auto: AutoCalcs): HardStopResult[] {
  const stage = (inp.stage ?? "").toLowerCase();
  const sector = (inp.sector ?? "").toLowerCase();
  const founderEq = num(inp.founder_ownership_pct);
  const arr = num(inp.current_arr);
  const age = auto.company_age;

  return [
    {
      key: "stage_cap",
      rule: "Series B+",
      data: inp.stage ?? "N/A",
      failed: /series\s*b|series\s*c|growth/.test(stage),
    },
    {
      key: "sector_exclusion",
      rule: "Pharma / Med Devices",
      data: inp.sector ?? "N/A",
      failed: /pharma|medical device|med devices|medtech device/.test(sector),
    },
    {
      key: "founder_equity",
      rule: "<20% pre-round",
      data: founderEq != null ? `${(founderEq * 100).toFixed(0)}%` : "N/A",
      failed: founderEq != null && founderEq < 0.2,
    },
    {
      key: "stagnancy",
      rule: ">3.5yr + <$100K ARR",
      data: age != null && arr != null ? `${age.toFixed(1)}yr · $${arr.toLocaleString()}` : "N/A",
      failed: age != null && age > 3.5 && arr != null && arr < 100_000,
    },
  ];
}

export function evaluateRiskFlags(inp: ScorecardInputs, auto: AutoCalcs): RiskFlag[] {
  const founderEq = num(inp.founder_ownership_pct);
  const sector = (inp.sector ?? "").toLowerCase();
  const isAiRobotics = /ai|robotic|ml|machine learning/.test(sector);
  const nrr = num(inp.nrr);
  const churn = num(inp.monthly_churn);
  const bridges = num(inp.bridge_rounds_18mo);
  const topCust = num(inp.top_cust_pct);
  const debt = num(inp.total_debt_excl_convertibles);
  const netBurn = num(inp.net_burn);
  const arr = num(inp.current_arr);
  const age = auto.company_age;
  const gm = num(inp.gross_margin);
  const burnToRound = auto.burn_to_round;

  const flag = (cond: boolean | null): RiskFlag["status"] =>
    cond === null ? "N/A" : cond ? "FLAG" : "PASS";

  return [
    {
      key: "cap_table",
      type: "RED",
      risk: "Cap Table Impairment",
      check: "Founder <50%/<35%",
      status: founderEq == null ? "N/A" : flag(founderEq < 0.35),
    },
    {
      key: "no_tech_cofounder",
      type: "RED",
      risk: "No Technical Co-Founder",
      check: "AI/Robotics w/o CTO",
      status: !isAiRobotics ? "PASS" : flag(inp.has_technical_cofounder === false),
    },
    {
      key: "churn",
      type: "RED",
      risk: "High Churn / Low NRR",
      check: "NRR<80% or churn>5%",
      status: nrr == null && churn == null ? "N/A" : flag((nrr != null && nrr < 0.8) || (churn != null && churn > 0.05)),
    },
    {
      key: "bridges",
      type: "RED",
      risk: "Excessive Bridges",
      check: "2+ in 18mo",
      status: bridges == null ? "N/A" : flag(bridges >= 2),
    },
    {
      key: "single_thread",
      type: "RED",
      risk: "Single-Thread Revenue",
      check: ">70% from 1 cust",
      status: topCust == null ? "N/A" : flag(topCust > 0.7),
    },
    {
      key: "debt",
      type: "RED",
      risk: "Excessive Debt",
      check: ">$250K non-conv",
      status: debt == null ? "N/A" : flag(debt > 250_000),
    },
    {
      key: "high_burn",
      type: "YLW",
      risk: "High Burn",
      check: ">$250K/mo net",
      status: netBurn == null ? "N/A" : flag(netBurn > 250_000),
    },
    {
      key: "zombie",
      type: "YLW",
      risk: "Zombie Velocity",
      check: ">3yr, <$250K ARR",
      status: age == null || arr == null ? "N/A" : flag(age > 3 && arr < 250_000),
    },
    {
      key: "platform_dependency",
      type: "YLW",
      risk: "Platform Dependency",
      check: "No moat / thin wrapper",
      status: "MANUAL",
    },
    {
      key: "low_gm",
      type: "YLW",
      risk: "Low Gross Margins",
      check: "GM<40%",
      status: gm == null ? "N/A" : flag(gm < 0.4),
    },
    {
      key: "burn_to_round",
      type: "YLW",
      risk: "High Burn-to-Scale",
      check: "Burn>25% of round",
      status: burnToRound == null ? "N/A" : flag(burnToRound > 0.25),
    },
  ];
}

export function computeSnapshot(
  inputs: ScorecardInputs,
  ratings: QualitativeRatings,
  benchmarks: Map<string, Benchmark>,
): ComputedSnapshot {
  const autocalcs = computeAutoCalcs(inputs);
  const { metrics, quant_total } = computeMetrics(inputs, benchmarks);
  const qual_total = computeQualitativeTotal(ratings);
  const qual_score = qual_total * 2.4;
  const quant_score = quant_total * 1.6;
  const blended_score = Math.round((qual_score + quant_score) * 10) / 10;
  const hard_stops = evaluateHardStops(inputs, autocalcs);
  const risk_flags = evaluateRiskFlags(inputs, autocalcs);
  return {
    autocalcs,
    metrics,
    qual_total,
    quant_total,
    qual_score,
    quant_score,
    blended_score,
    classification: classify(blended_score),
    hard_stops,
    hard_stop_failed: hard_stops.some((h) => h.failed),
    risk_flags,
    red_flag_count: risk_flags.filter((f) => f.type === "RED" && f.status === "FLAG").length,
    yellow_flag_count: risk_flags.filter((f) => f.type === "YLW" && f.status === "FLAG").length,
  };
}

export function buildBenchmarkMap(rows: Benchmark[] | undefined | null): Map<string, Benchmark> {
  const m = new Map<string, Benchmark>();
  (rows ?? []).forEach((b) => m.set(b.metric, b));
  return m;
}
