import React from 'react';
import { formatMoney, formatMultiple, type RollupTotals } from '@/lib/portfolio/metrics';

interface Props {
  totals: RollupTotals;
  activeCount: number;
}

export function PortfolioKpiTiles({ totals, activeCount }: Props) {
  const tiles: Array<{ label: string; value: string }> = [
    { label: 'Total Invested', value: formatMoney(totals.invested, '$0') },
    { label: 'Current FMV', value: formatMoney(totals.fmv, '$0') },
    { label: 'Realized', value: formatMoney(totals.realized, '$0') },
    { label: 'Unrealized', value: formatMoney(totals.unrealized, '$0') },
    { label: 'TVPI', value: formatMultiple(totals.tvpi) },
    { label: 'DPI', value: formatMultiple(totals.dpi) },
    { label: 'Net MOIC', value: formatMultiple(totals.moic) },
    { label: 'Positions', value: String(totals.count) },
    { label: 'Active', value: String(activeCount) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2 sm:gap-3 mb-6">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg border bg-card px-3 py-3 text-center">
          <p className="text-base sm:text-xl font-bold text-primary tabular-nums truncate">{tile.value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-tight">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}
