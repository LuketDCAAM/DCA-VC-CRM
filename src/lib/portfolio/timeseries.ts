// Round step-up + time-series math. Money values are in CENTS.
// Pure functions only so they can be unit tested.

import { comparePeriods, periodLabel, runwayMonths } from '@/lib/portfolio/metrics';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';
import type { PortcoRound } from '@/hooks/portfolio/usePortcoRounds';

export type StepUpBasis = 'pps' | 'post_money';

export interface RoundChainEntry {
  round: PortcoRound;
  /** Step-up vs. the prior round (price per share preferred, post-money fallback). */
  stepUp: number | null;
  stepUpBasis: StepUpBasis | null;
  /** Step-up vs. the first round we invested in. */
  stepUpVsEntry: number | null;
  /** Cumulative step-up vs. the earliest round on record. */
  cumulativeStepUp: number | null;
  monthsSincePrior: number | null;
  priorRoundName: string | null;
}

function monthsBetween(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  const from = new Date(b).getTime();
  const to = new Date(a).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;
  return (to - from) / (1000 * 60 * 60 * 24 * 30.4375);
}

function ratio(current: number | null | undefined, prior: number | null | undefined): number | null {
  if (current == null || prior == null || prior <= 0) return null;
  return current / prior;
}

/** Sort rounds oldest first; undated rounds fall to the end preserving insert order. */
export function sortRounds(rounds: PortcoRound[]): PortcoRound[] {
  return [...rounds].sort((a, b) => {
    if (a.close_date && b.close_date) return a.close_date.localeCompare(b.close_date);
    if (a.close_date) return -1;
    if (b.close_date) return 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** Build the ordered round chain with step-up multiples for one company. */
export function buildRoundChain(rounds: PortcoRound[]): RoundChainEntry[] {
  const sorted = sortRounds(rounds);
  const entry = sorted.find((r) => r.we_participated) ?? null;
  const first = sorted[0] ?? null;

  return sorted.map((round, i) => {
    const prior = i > 0 ? sorted[i - 1] : null;

    const ppsStep = ratio(round.price_per_share, prior?.price_per_share);
    const pmStep = ratio(round.post_money_valuation, prior?.post_money_valuation);
    const stepUp = ppsStep ?? pmStep;
    const stepUpBasis: StepUpBasis | null = ppsStep != null ? 'pps' : pmStep != null ? 'post_money' : null;

    const vsEntry =
      entry && entry.id !== round.id
        ? ratio(round.price_per_share, entry.price_per_share) ?? ratio(round.post_money_valuation, entry.post_money_valuation)
        : null;

    const cumulative =
      first && first.id !== round.id
        ? ratio(round.price_per_share, first.price_per_share) ?? ratio(round.post_money_valuation, first.post_money_valuation)
        : null;

    return {
      round,
      stepUp,
      stepUpBasis,
      stepUpVsEntry: vsEntry,
      cumulativeStepUp: cumulative,
      monthsSincePrior: monthsBetween(round.close_date, prior?.close_date),
      priorRoundName: prior?.round_name ?? null,
    };
  });
}

export interface StepUpTableRow extends RoundChainEntry {
  companyId: string;
  companyName: string;
}

export function buildStepUpRows(
  companies: Array<{ id: string; company_name: string }>,
  roundsByCompany: Map<string, PortcoRound[]>,
): StepUpTableRow[] {
  const out: StepUpTableRow[] = [];
  for (const company of companies) {
    const chain = buildRoundChain(roundsByCompany.get(company.id) ?? []);
    for (const link of chain) out.push({ ...link, companyId: company.id, companyName: company.company_name });
  }
  return out;
}

// ---------- Quarterly series ----------

export type TrendMetric =
  | 'arr'
  | 'revenue'
  | 'gross_margin'
  | 'net_burn'
  | 'gross_burn'
  | 'cash_balance'
  | 'headcount'
  | 'nrr'
  | 'runway'
  | 'our_fmv'
  | 'company_valuation';

export interface TrendMetricSpec {
  key: TrendMetric;
  label: string;
  unit: 'money' | 'percent' | 'number' | 'months';
}

export const TREND_METRICS: TrendMetricSpec[] = [
  { key: 'arr', label: 'ARR', unit: 'money' },
  { key: 'revenue', label: 'Revenue (quarter)', unit: 'money' },
  { key: 'gross_margin', label: 'Gross margin', unit: 'percent' },
  { key: 'net_burn', label: 'Net burn (monthly)', unit: 'money' },
  { key: 'gross_burn', label: 'Gross burn (monthly)', unit: 'money' },
  { key: 'cash_balance', label: 'Cash balance', unit: 'money' },
  { key: 'runway', label: 'Runway', unit: 'months' },
  { key: 'headcount', label: 'Headcount', unit: 'number' },
  { key: 'nrr', label: 'NRR', unit: 'percent' },
  { key: 'our_fmv', label: 'Our fair value', unit: 'money' },
  { key: 'company_valuation', label: 'Company valuation', unit: 'money' },
];

export function metricValue(q: PortcoQuarter, metric: TrendMetric): number | null {
  if (metric === 'runway') return runwayMonths(q.cash_balance, q.net_burn);
  const value = (q as unknown as Record<string, number | null | undefined>)[metric];
  return value ?? null;
}

export interface SeriesPoint {
  period: string;
  periodIdx: number;
  [companyKey: string]: number | string | null;
}

/**
 * Wide-format series for charting: one row per period, one key per company.
 * `indexed` rebases each company to 100 at its first reported value.
 */
export function buildMetricSeries(
  companies: Array<{ id: string; company_name: string }>,
  quartersByCompany: Map<string, PortcoQuarter[]>,
  metric: TrendMetric,
  indexed = false,
): { data: SeriesPoint[]; keys: Array<{ id: string; name: string }> } {
  const periods = new Map<number, { year: number; quarter: number }>();
  const perCompany = new Map<string, Map<number, number>>();
  const keys: Array<{ id: string; name: string }> = [];

  for (const company of companies) {
    const list = [...(quartersByCompany.get(company.id) ?? [])].sort(comparePeriods);
    const values = new Map<number, number>();
    let base: number | null = null;
    for (const q of list) {
      const raw = metricValue(q, metric);
      if (raw == null) continue;
      const idx = q.fiscal_year * 4 + (q.fiscal_quarter - 1);
      periods.set(idx, { year: q.fiscal_year, quarter: q.fiscal_quarter });
      if (indexed) {
        if (base == null && raw !== 0) base = raw;
        if (base == null) continue;
        values.set(idx, (raw / base) * 100);
      } else {
        values.set(idx, raw);
      }
    }
    if (values.size) {
      perCompany.set(company.id, values);
      keys.push({ id: company.id, name: company.company_name });
    }
  }

  const data: SeriesPoint[] = Array.from(periods.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([idx, p]) => {
      const point: SeriesPoint = { period: periodLabel(p.year, p.quarter), periodIdx: idx };
      for (const key of keys) point[key.id] = perCompany.get(key.id)?.get(idx) ?? null;
      return point;
    });

  return { data, keys };
}

export interface ValuationPoint {
  period: string;
  periodIdx: number;
  invested: number;
  fmv: number;
  realized: number;
  moic: number | null;
  tvpi: number | null;
}

export interface ValuationSeriesInput {
  companyId: string;
  invested: number;
  realized: number;
  /** Fallback FMV when no quarterly mark exists yet. */
  currentFmv: number;
  investmentDates: string[];
}

function investedThrough(dates: string[], amounts: number[], year: number, quarter: number): number {
  const cutoff = new Date(Date.UTC(year, quarter * 3, 0)).getTime();
  let total = 0;
  dates.forEach((d, i) => {
    const t = d ? new Date(d).getTime() : NaN;
    if (!Number.isFinite(t) || t <= cutoff) total += amounts[i] ?? 0;
  });
  return total;
}

/** Value over time: cumulative invested vs. marked FMV vs. realized, quarter by quarter. */
export function buildValuationSeries(
  positions: Array<{
    companyId: string;
    invested: number;
    realized: number;
    currentFmv: number;
    investmentDates: string[];
    investmentAmounts: number[];
  }>,
  quartersByCompany: Map<string, PortcoQuarter[]>,
): ValuationPoint[] {
  const periods = new Set<number>();
  for (const p of positions) {
    for (const q of quartersByCompany.get(p.companyId) ?? []) {
      periods.add(q.fiscal_year * 4 + (q.fiscal_quarter - 1));
    }
  }

  return Array.from(periods)
    .sort((a, b) => a - b)
    .map((idx) => {
      const year = Math.floor(idx / 4);
      const quarter = (idx % 4) + 1;
      let invested = 0;
      let fmv = 0;
      let realized = 0;

      for (const p of positions) {
        const list = [...(quartersByCompany.get(p.companyId) ?? [])].sort(comparePeriods);
        const upTo = list.filter((q) => q.fiscal_year * 4 + (q.fiscal_quarter - 1) <= idx);
        if (!upTo.length) continue;

        const investedSoFar = p.investmentDates.length
          ? investedThrough(p.investmentDates, p.investmentAmounts, year, quarter)
          : p.invested;
        if (investedSoFar <= 0) continue;

        const lastMark = [...upTo].reverse().find((q) => q.our_fmv != null);
        const marked =
          lastMark?.our_fmv ??
          (() => {
            const withVal = [...upTo].reverse().find((q) => q.company_valuation != null && q.ownership_pct != null);
            return withVal ? Math.round((withVal.company_valuation as number) * (withVal.ownership_pct as number)) : null;
          })();

        invested += investedSoFar;
        fmv += marked ?? p.currentFmv;
        realized += p.realized;
      }

      return {
        period: periodLabel(year, quarter),
        periodIdx: idx,
        invested,
        fmv,
        realized,
        moic: invested > 0 ? fmv / invested : null,
        tvpi: invested > 0 ? (fmv + realized) / invested : null,
      };
    });
}

export function medianOf(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}
