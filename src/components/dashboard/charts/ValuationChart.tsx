
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ValuationSummaryMetrics } from './valuation/ValuationSummaryMetrics';
import { ValuationRangesChart } from './valuation/ValuationRangesChart';
import { QuarterlyValuationTrendsChart } from './valuation/QuarterlyValuationTrendsChart';

interface ValuationAnalysis {
  averageValuation: number;
  medianValuation: number;
  totalDealValue: number;
  valuationRanges: Array<{ range: string; count: number }>;
  quarterlyTrends: Array<{ 
    quarter: string; 
    averageValuation: number; 
    medianValuation: number; 
    dealCount: number 
  }>;
}

interface ValuationChartProps {
  data: ValuationAnalysis;
}

export function ValuationChart({ data }: ValuationChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Valuation Analysis</CardTitle>
        <CardDescription>Deal distribution by valuation ranges and quarterly trends</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Summary Metrics */}
        <ValuationSummaryMetrics
          averageValuation={data.averageValuation}
          medianValuation={data.medianValuation}
          totalDealValue={data.totalDealValue}
        />
        
        {/* Side by Side Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Valuation Ranges Chart */}
          <ValuationRangesChart data={data.valuationRanges} />

          {/* Quarterly Trends Chart */}
          <QuarterlyValuationTrendsChart data={data.quarterlyTrends} />
        </div>
      </CardContent>
    </Card>
  );
}
