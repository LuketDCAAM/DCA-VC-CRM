import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ValuationSummaryMetrics } from './valuation/ValuationSummaryMetrics';
import { ValuationRangesChart } from './valuation/ValuationRangesChart';
import { QuarterlyValuationTrendsChart } from './valuation/QuarterlyValuationTrendsChart';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
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
    dealCount: number 
  }>;
}

interface ValuationChartProps {
  data: ValuationAnalysis;
  deals: Deal[];
}

export function ValuationChart({ data, deals }: ValuationChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);
  
  // Recalculate valuation analysis based on filtered deals
  const filteredData = {
    ...data,
    // You would recalculate these based on filteredDeals in a real implementation
    // For now, we'll use the original data
  };

  if (!filteredData.valuationRanges.length && !filteredData.quarterlyTrends.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Valuation Analysis</CardTitle>
              <CardDescription>Deal valuations breakdown and trends</CardDescription>
            </div>
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No valuation data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Valuation Analysis</CardTitle>
            <CardDescription>Deal valuations breakdown and trends</CardDescription>
          </div>
          <PipelineToggle 
            showActiveOnly={showActiveOnly} 
            onToggle={setShowActiveOnly}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ValuationSummaryMetrics 
          averageValuation={filteredData.averageValuation}
          medianValuation={filteredData.medianValuation}
          totalDealValue={filteredData.totalDealValue}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ValuationRangesChart data={filteredData.valuationRanges} />
          <QuarterlyValuationTrendsChart data={filteredData.quarterlyTrends} />
        </div>
      </CardContent>
    </Card>
  );
}