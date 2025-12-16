import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { QuarterFilter } from './shared/QuarterFilter';
import { useQuarterFilter } from './shared/useQuarterFilter';
import { getChartColor, CHART_DIMENSIONS } from './shared/chartConfig';
import { Deal } from '@/types/deal';

interface RoundStageChartProps {
  data: Array<{ stage: string; count: number; percentage: number }>;
  deals: Deal[];
}

export function RoundStageChart({ data, deals }: RoundStageChartProps) {
  const { selectedQuarter, setSelectedQuarter, availableQuarters, filteredDeals: quarterFiltered } = useQuarterFilter(deals);
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(quarterFiltered);
  
  // Recalculate round stage data based on filtered deals - exclude unknown/null values
  const roundCounts = filteredDeals.reduce((acc, deal) => {
    const stage = deal.round_stage;
    // Skip null, undefined, empty, 'Unknown', 'N/A' values
    if (!stage || stage.trim() === '' || stage.toLowerCase() === 'unknown' || stage.toLowerCase() === 'n/a') {
      return acc;
    }
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(roundCounts).reduce((sum, count) => sum + count, 0);
  const calculatedData = Object.entries(roundCounts)
    .map(([stage, count]) => ({
      stage,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const chartData = calculatedData.filter(item => item.count > 0);
  
  const chartConfig = chartData.reduce((config, item, index) => {
    config[item.stage] = {
      label: item.stage,
      color: getChartColor(index, chartData.length > 5)
    };
    return config;
  }, {} as any);

  if (!chartData.length) {
    return (
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Round Stage Distribution</CardTitle>
            <CardDescription>Deal distribution by funding round</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <QuarterFilter
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
              availableQuarters={availableQuarters}
            />
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
        </div>
      </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Round Stage Distribution</CardTitle>
            <CardDescription>Deal distribution by funding round</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <QuarterFilter
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
              availableQuarters={availableQuarters}
            />
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={CHART_DIMENSIONS.pieOuterRadius}
                innerRadius={CHART_DIMENSIONS.donutInnerRadius}
                dataKey="count"
                label={({ percentage }) => percentage >= 5 ? `${percentage}%` : ''}
                labelLine={false}
                stroke="hsl(var(--background))"
                strokeWidth={CHART_DIMENSIONS.strokeWidth}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getChartColor(index, chartData.length > 5)}
                  />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.stage}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} deals ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {chartData.map((item, index) => (
              <div key={item.stage} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 flex-shrink-0 rounded-sm" 
                  style={{ backgroundColor: getChartColor(index, chartData.length > 5) }}
                />
                <span className="truncate">{item.stage}</span>
                <span className="text-muted-foreground ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}