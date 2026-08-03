import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ValuationSummaryMetrics } from './valuation/ValuationSummaryMetrics';
import { ValuationRangesChart } from './valuation/ValuationRangesChart';
import { QuarterlyValuationTrendsChart } from './valuation/QuarterlyValuationTrendsChart';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { calculateValuationAnalysis } from '@/hooks/deals/analytics/valuationAnalytics';
import { Deal } from '@/types/deal';

interface ValuationAnalysis {
  averageValuation: number;
  medianValuation: number;
  totalDealValue: number;
  valuationRanges: Array<{ range: string; count: number }>;
  quarterlyTrends: Array<{
    quarter: string;
    averageValuation: number;
    medianValuation: number;
    dealCount: number;
  }>;
}

interface ValuationChartProps {
  data: ValuationAnalysis;
  deals: Deal[];
}

export function ValuationChart({ data, deals }: ValuationChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);

  // Recompute the analysis whenever the pipeline filter changes so the toggle
  // actually affects the metrics and charts.
  const filteredData: ValuationAnalysis = useMemo(() => {
    if (!showActiveOnly) return data;
    return calculateValuationAnalysis(filteredDeals);
  }, [showActiveOnly, filteredDeals, data]);

  const valuedDealCount = useMemo(
    () =>
      (showActiveOnly ? filteredDeals : deals).filter(
        (d) => d.post_money_valuation && d.post_money_valuation > 0,
      ).length,
    [showActiveOnly, filteredDeals, deals],
  );

  const header = (
    <CardHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Valuation Analysis</CardTitle>
          <CardDescription>
            {valuedDealCount > 0
              ? `Based on ${valuedDealCount} deal${valuedDealCount === 1 ? '' : 's'} with a post-money valuation${
                  showActiveOnly ? ' in the active pipeline' : ''
                }`
              : 'Deal valuations breakdown and trends'}
          </CardDescription>
        </div>
        <PipelineToggle
          showActiveOnly={showActiveOnly}
          onToggle={setShowActiveOnly}
          className="shrink-0"
        />
      </div>
    </CardHeader>
  );

  const hasData = valuedDealCount > 0;

  if (!hasData) {
    return (
      <Card>
        {header}
        <CardContent>
          <p className="text-muted-foreground text-center py-12 text-sm">
            {showActiveOnly
              ? 'No active-pipeline deals have a post-money valuation yet.'
              : 'No valuation data available.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="space-y-8">
        <ValuationSummaryMetrics
          averageValuation={filteredData.averageValuation}
          medianValuation={filteredData.medianValuation}
          totalDealValue={filteredData.totalDealValue}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ValuationRangesChart data={filteredData.valuationRanges} />
          <QuarterlyValuationTrendsChart data={filteredData.quarterlyTrends} />
        </div>
      </CardContent>
    </Card>
  );
}
