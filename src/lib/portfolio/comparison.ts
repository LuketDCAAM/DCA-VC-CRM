// Cross-portfolio financial comparison math. Money in CENTS.

import { comparePeriods, deriveQuarter, periodIndex, periodLabel, runwayMonths, growth, type PerformanceStatus } from '@/lib/portfolio/metrics';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';

export interface ComparisonRow {
  companyId: string;
  companyName: string;
  vehicle: string | null;
  sector: string | null;
  periodLabel: string | null;
  arr: number | null;
  arrQoQ: number | null;
  arrYoY: number | null;
  revenue: number | null;
  grossMargin: number | null;
  netBurn: number | null;
  cash: number | null;
  runway: number | null;
  nrr: number | null;
  grr: number | null;
  churn: number | null;
  headcount: number | null;
  arrPerHead: number | null;
  burnMultiple: number | null; // net burn (quarter) / net new ARR
  capitalEfficiency: number | null; // ARR / invested
  invested: number;
  fmv: number;
  moic: number | null;
  fmvToArr: number | null;
  status: PerformanceStatus;
  statusReasons: string[];
}

/** Pick the row at or before the requested period (so companies reporting late still show). */
function pickQuarter(list: PortcoQuarter[], target: { fiscal_year: number; fiscal_quarter: number } | null) {
  if (!list.length) return null;
  const sorted = [...list].sort(comparePeriods);
  if (!target) return sorted[sorted.length - 1];
  const limit = periodIndex(target.fiscal_year, target.fiscal_quarter);
  const eligible = sorted.filter((q) => periodIndex(q.fiscal_year, q.fiscal_quarter) <= limit);
  return eligible.length ? eligible[eligible.length - 1] : null;
}

export function buildComparisonRows(
  positions: EnrichedPosition[],
  quartersByCompany: Map<string, PortcoQuarter[]>,
  period: { fiscal_year: number; fiscal_quarter: number } | null,
): ComparisonRow[] {
  return positions.map(({ company, position, metrics }) => {
    const list = quartersByCompany.get(company.id) ?? [];
    const current = pickQuarter(list, period);
    const sorted = [...list].sort(comparePeriods);
    const idx = current
      ? sorted.findIndex((q) => q.fiscal_year === current.fiscal_year && q.fiscal_quarter === current.fiscal_quarter)
      : -1;
    const prior = idx > 0 ? sorted[idx - 1] : undefined;
    const yearAgo = current
      ? sorted.find((q) => q.fiscal_year === current.fiscal_year - 1 && q.fiscal_quarter === current.fiscal_quarter)
      : undefined;

    const derived = current ? deriveQuarter(current, prior, yearAgo) : null;
    const netNewArr = current && prior && current.arr != null && prior.arr != null ? current.arr - prior.arr : null;
    const quarterBurn = current?.net_burn != null ? current.net_burn * 3 : null;

    const status = (current?.status_override || current?.performance_status || 'Unknown') as PerformanceStatus;
    const reasons = ((current?.computed as Record<string, unknown> | undefined)?.status_reasons as string[]) ?? [];

    return {
      companyId: company.id,
      companyName: company.company_name,
      vehicle: position?.vehicle ?? null,
      sector: position?.sector ?? null,
      periodLabel: current ? periodLabel(current.fiscal_year, current.fiscal_quarter) : null,
      arr: current?.arr ?? null,
      arrQoQ: derived?.arrQoQ ?? null,
      arrYoY: derived?.arrYoY ?? null,
      revenue: current?.revenue ?? null,
      grossMargin: current?.gross_margin ?? null,
      netBurn: current?.net_burn ?? null,
      cash: current?.cash_balance ?? null,
      runway: runwayMonths(current?.cash_balance, current?.net_burn),
      nrr: current?.nrr ?? null,
      grr: current?.grr ?? null,
      churn: current?.monthly_churn ?? null,
      headcount: current?.headcount ?? null,
      arrPerHead: current?.arr != null && current?.headcount ? current.arr / current.headcount : null,
      burnMultiple: quarterBurn != null && netNewArr != null && netNewArr > 0 ? quarterBurn / netNewArr : null,
      capitalEfficiency: current?.arr != null && metrics.totalInvested > 0 ? current.arr / metrics.totalInvested : null,
      invested: metrics.totalInvested,
      fmv: metrics.currentFmv,
      moic: metrics.moic,
      fmvToArr: current?.arr && current.arr > 0 && metrics.currentFmv > 0 ? metrics.currentFmv / current.arr : null,
      status,
      statusReasons: reasons,
    };
  });
}

export function median(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export function sum(values: Array<number | null | undefined>): number {
  return values.reduce((acc, v) => acc + (v ?? 0), 0) as number;
}

export { growth };
