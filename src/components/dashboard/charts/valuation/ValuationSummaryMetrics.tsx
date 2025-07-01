
import React from 'react';
import { formatCurrency } from './valuationUtils';

interface ValuationSummaryMetricsProps {
  averageValuation: number;
  medianValuation: number;
  totalDealValue: number;
}

export function ValuationSummaryMetrics({ 
  averageValuation, 
  medianValuation, 
  totalDealValue 
}: ValuationSummaryMetricsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">
          {formatCurrency(averageValuation)}
        </p>
        <p className="text-sm text-muted-foreground">Average Valuation</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">
          {formatCurrency(medianValuation)}
        </p>
        <p className="text-sm text-muted-foreground">Median Valuation</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">
          {formatCurrency(totalDealValue)}
        </p>
        <p className="text-sm text-muted-foreground">Total Deal Value</p>
      </div>
    </div>
  );
}
