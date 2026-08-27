import { useMemo } from 'react';
import type { PortfolioCompany } from '@/hooks/usePortfolioCompanies';
import type { PortfolioPosition } from '@/hooks/portfolio/usePortfolioPositions';
import { VEHICLES } from '@/hooks/portfolio/usePortfolioPositions';
import {
  aggregate,
  computePositionMetrics,
  emptyTotals,
  type PositionMetrics,
  type RollupTotals,
} from '@/lib/portfolio/metrics';

export interface EnrichedPosition {
  company: PortfolioCompany;
  position: PortfolioPosition | null;
  metrics: PositionMetrics;
}

export interface RollupRow extends RollupTotals {
  label: string;
  shareOfNav: number | null;
}

export function usePortfolioRollups(companies: PortfolioCompany[], byCompany: Map<string, PortfolioPosition>) {
  return useMemo(() => {
    const rows: EnrichedPosition[] = companies.map((company) => {
      const position = byCompany.get(company.id) ?? null;
      const totalInvested = company.investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
      const investmentDates = company.investments
        .map((inv) => inv.investment_date)
        .filter(Boolean)
        .sort();
      const firstDate = position?.first_investment_date ?? investmentDates[0] ?? null;

      const fallbackFmv =
        position?.current_fmv ??
        (company.current_valuation?.last_round_post_money_valuation != null &&
        company.current_valuation?.current_ownership_percentage != null
          ? Math.round(
              company.current_valuation.last_round_post_money_valuation *
                company.current_valuation.current_ownership_percentage,
            )
          : null);

      const metrics = computePositionMetrics({
        totalInvested,
        currentFmv: fallbackFmv,
        realizedProceeds: position?.realized_proceeds ?? 0,
        firstInvestmentDate: firstDate,
      });

      return { company, position, metrics };
    });

    const totals = aggregate(rows.map((r) => r.metrics));
    const activeCount = rows.filter(
      (r) => (r.position?.position_status ?? (r.company.status === 'Active' ? 'Active' : 'Exited - Financial')) === 'Active',
    ).length;

    const byVehicle: RollupRow[] = VEHICLES.map((vehicle) => {
      const subset = rows.filter((r) => r.position?.vehicle === vehicle);
      const t = subset.length ? aggregate(subset.map((r) => r.metrics)) : emptyTotals();
      return { label: vehicle, ...t, shareOfNav: totals.fmv > 0 ? t.fmv / totals.fmv : null };
    });
    const unassigned = rows.filter((r) => !r.position?.vehicle);
    if (unassigned.length) {
      const t = aggregate(unassigned.map((r) => r.metrics));
      byVehicle.push({ label: 'Unassigned', ...t, shareOfNav: totals.fmv > 0 ? t.fmv / totals.fmv : null });
    }

    const vintageKeys = Array.from(
      new Set(rows.map((r) => r.metrics.vintage).filter((v): v is number => v != null)),
    ).sort();
    const byVintage: RollupRow[] = vintageKeys.map((year) => {
      const subset = rows.filter((r) => r.metrics.vintage === year);
      const t = aggregate(subset.map((r) => r.metrics));
      return { label: String(year), ...t, shareOfNav: totals.fmv > 0 ? t.fmv / totals.fmv : null };
    });

    const statusCounts = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.position?.position_status ?? 'Unclassified';
      statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
    });

    return { rows, totals, activeCount, byVehicle, byVintage, statusCounts };
  }, [companies, byCompany]);
}
