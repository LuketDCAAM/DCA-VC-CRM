import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { Deal } from '@/types/deal';

interface RoundStageChartProps {
  data: Array<{ stage: string; count: number; percentage: number }>;
  deals: Deal[];
}

const ROUND_STAGE_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FFC658', '#FF7300'
];

export function RoundStageChart({ data, deals }: RoundStageChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);
  
  // Recalculate round stage data based on filtered deals
  const roundCounts = filteredDeals.reduce((acc, deal) => {
    const stage = deal.round_stage || 'Unknown';
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
      color: ROUND_STAGE_COLORS[index % ROUND_STAGE_COLORS.length]
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
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
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
          <PipelineToggle 
            showActiveOnly={showActiveOnly} 
            onToggle={setShowActiveOnly}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={40}
                dataKey="count"
                label={({ stage, percentage, x, y }) => {
                  // Only show label if percentage is above 5% to avoid overcrowding
                  if (percentage < 5) return '';
                  return `${stage}: ${percentage}%`;
                }}
                labelLine={false}
                fontSize={12}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={ROUND_STAGE_COLORS[index % ROUND_STAGE_COLORS.length]} 
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
      </CardContent>
    </Card>
  );
}