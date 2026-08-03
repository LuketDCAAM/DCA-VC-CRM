import React from 'react';
import { formatCurrency } from './valuationUtils';

interface ValuationSummaryMetricsProps {
  averageValuation: number;
  medianValuation: number;
  totalDealValue: number;
}

const metricLabels = [
  { key: 'average', label: 'Average Valuation' },
  { key: 'median', label: 'Median Valuation' },
  { key: 'total', label: 'Total Round Size' },
] as const;

export function ValuationSummaryMetrics({
  averageValuation,
  medianValuation,
  totalDealValue,
}: ValuationSummaryMetricsProps) {
  const values: Record<string, number> = {
    average: averageValuation,
    median: medianValuation,
    total: totalDealValue,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {metricLabels.map(({ key, label }) => (
        <div key={key} className="rounded-lg border bg-muted/30 px-4 py-3 text-center">
          <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums truncate">
            {formatCurrency(values[key])}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
