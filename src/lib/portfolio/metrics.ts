// Pure portfolio math. All money values are in CENTS unless stated otherwise.
// No DB access here so these can be unit tested.

export type PerformanceStatus = 'On Track' | 'Watch' | 'At Risk' | 'Unknown';

export interface PositionInput {
  totalInvested: number; // cents
  currentFmv: number | null; // cents
  realizedProceeds: number; // cents
  firstInvestmentDate?: string | null;
}

export interface PositionMetrics {
  totalInvested: number;
  currentFmv: number;
  realizedProceeds: number;
  unrealized: number;
  moic: number | null;
  tvpi: number | null;
  dpi: number | null;
  vintage: number | null;
}

export function computePositionMetrics(p: PositionInput): PositionMetrics {
  const invested = p.totalInvested || 0;
  const fmv = p.currentFmv ?? 0;
  const realized = p.realizedProceeds || 0;
  const unrealized = fmv;
  const denom = invested > 0 ? invested : null;

  return {
    totalInvested: invested,
    currentFmv: fmv,
    realizedProceeds: realized,
    unrealized,
    moic: denom ? fmv / denom : null,
    tvpi: denom ? (fmv + realized) / denom : null,
    dpi: denom ? realized / denom : null,
    vintage: p.firstInvestmentDate ? new Date(p.firstInvestmentDate).getUTCFullYear() : null,
  };
}

export interface RollupTotals {
  count: number;
  invested: number;
  fmv: number;
  realized: number;
  unrealized: number;
  moic: number | null;
  tvpi: number | null;
  dpi: number | null;
}

export function emptyTotals(): RollupTotals {
  return { count: 0, invested: 0, fmv: 0, realized: 0, unrealized: 0, moic: null, tvpi: null, dpi: null };
}

export function aggregate(rows: PositionMetrics[]): RollupTotals {
  const t = emptyTotals();
  for (const r of rows) {
    t.count += 1;
    t.invested += r.totalInvested;
    t.fmv += r.currentFmv;
    t.realized += r.realizedProceeds;
    t.unrealized += r.unrealized;
  }
  if (t.invested > 0) {
    t.moic = t.fmv / t.invested;
    t.tvpi = (t.fmv + t.realized) / t.invested;
    t.dpi = t.realized / t.invested;
  }
  return t;
}

export function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = out.get(k);
    if (list) list.push(row);
    else out.set(k, [row]);
  }
  return out;
}

// ---------- Quarterly metrics ----------

export interface QuarterInput {
  fiscal_year: number;
  fiscal_quarter: number;
  revenue?: number | null;
  arr?: number | null;
  gross_margin?: number | null;
  gross_burn?: number | null;
  net_burn?: number | null;
  cash_balance?: number | null;
  headcount?: number | null;
  nrr?: number | null;
  grr?: number | null;
  monthly_churn?: number | null;
  customer_count?: number | null;
  custom_metrics?: Record<string, number | null> | null;
  targets?: Record<string, number | null> | null;
}

export function periodLabel(year: number, quarter: number): string {
  return `${year}Q${quarter}`;
}

export function periodIndex(year: number, quarter: number): number {
  return year * 4 + (quarter - 1);
}

export function comparePeriods(a: { fiscal_year: number; fiscal_quarter: number }, b: { fiscal_year: number; fiscal_quarter: number }): number {
  return periodIndex(a.fiscal_year, a.fiscal_quarter) - periodIndex(b.fiscal_year, b.fiscal_quarter);
}

/** Months of runway from cash balance and monthly net burn (both cents). */
export function runwayMonths(cash: number | null | undefined, netBurn: number | null | undefined): number | null {
  if (cash == null || netBurn == null || netBurn <= 0) return null;
  return cash / netBurn;
}

export function growth(current: number | null | undefined, prior: number | null | undefined): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return (current - prior) / Math.abs(prior);
}

export interface DerivedQuarter {
  runway: number | null;
  arrQoQ: number | null;
  arrYoY: number | null;
  revenueQoQ: number | null;
  headcountQoQ: number | null;
  arrVariance: number | null; // vs target, as a fraction (-0.2 = 20% below plan)
}

export function deriveQuarter(
  current: QuarterInput,
  prior?: QuarterInput,
  yearAgo?: QuarterInput,
): DerivedQuarter {
  const target = current.targets?.arr ?? null;
  return {
    runway: runwayMonths(current.cash_balance, current.net_burn),
    arrQoQ: growth(current.arr, prior?.arr),
    arrYoY: growth(current.arr, yearAgo?.arr),
    revenueQoQ: growth(current.revenue, prior?.revenue),
    headcountQoQ: growth(current.headcount, prior?.headcount),
    arrVariance: target && current.arr != null ? (current.arr - target) / Math.abs(target) : null,
  };
}

export interface StatusResult {
  status: PerformanceStatus;
  reasons: string[];
}

/**
 * Rules:
 *  At Risk  — runway < 6 months, ARR shrinking, or >25% below plan
 *  Watch    — runway 6-12 months, ARR growth under 5% QoQ, or 10-25% below plan
 *  On Track — everything else with at least one signal present
 */
export function computeStatus(d: DerivedQuarter): StatusResult {
  const risk: string[] = [];
  const watch: string[] = [];

  if (d.runway != null) {
    if (d.runway < 6) risk.push(`Runway ${d.runway.toFixed(1)} months (< 6)`);
    else if (d.runway < 12) watch.push(`Runway ${d.runway.toFixed(1)} months (6-12)`);
  }

  if (d.arrQoQ != null) {
    if (d.arrQoQ < 0) risk.push(`ARR down ${(Math.abs(d.arrQoQ) * 100).toFixed(1)}% QoQ`);
    else if (d.arrQoQ < 0.05) watch.push(`ARR growth only ${(d.arrQoQ * 100).toFixed(1)}% QoQ`);
  }

  if (d.arrVariance != null) {
    if (d.arrVariance < -0.25) risk.push(`${(Math.abs(d.arrVariance) * 100).toFixed(0)}% below plan`);
    else if (d.arrVariance < -0.1) watch.push(`${(Math.abs(d.arrVariance) * 100).toFixed(0)}% below plan`);
  }

  const anySignal = d.runway != null || d.arrQoQ != null || d.arrVariance != null;
  if (risk.length) return { status: 'At Risk', reasons: risk };
  if (watch.length) return { status: 'Watch', reasons: watch };
  if (!anySignal) return { status: 'Unknown', reasons: ['Not enough data to assess'] };

  const good: string[] = [];
  if (d.runway != null) good.push(`Runway ${d.runway.toFixed(1)} months`);
  if (d.arrQoQ != null) good.push(`ARR +${(d.arrQoQ * 100).toFixed(1)}% QoQ`);
  if (d.arrVariance != null && d.arrVariance >= -0.1) good.push('At or near plan');
  return { status: 'On Track', reasons: good };
}

// ---------- Formatting ----------

export function formatMoney(cents: number | null | undefined, fallback = '—'): string {
  if (cents == null) return fallback;
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  const sign = dollars < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatMultiple(value: number | null | undefined, fallback = '—'): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return `${value.toFixed(2)}x`;
}

export function formatPercent(value: number | null | undefined, fallback = '—', digits = 1): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined, fallback = '—'): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat('en-US').format(value);
}

export function currentQuarter(date = new Date()): { fiscal_year: number; fiscal_quarter: number } {
  return { fiscal_year: date.getUTCFullYear(), fiscal_quarter: Math.floor(date.getUTCMonth() / 3) + 1 };
}
