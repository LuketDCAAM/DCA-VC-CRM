
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface RoundStageChartProps {
  data: Array<{ stage: string; count: number; percentage: number }>;
}

const ROUND_STAGE_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FFC658', '#FF7300'
];

export function RoundStageChart({ data }: RoundStageChartProps) {
  const chartConfig = data.reduce((config, item, index) => {
    config[item.stage] = {
      label: item.stage,
      color: ROUND_STAGE_COLORS[index % ROUND_STAGE_COLORS.length]
    };
    return config;
  }, {} as any);

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Round Stage Distribution</CardTitle>
          <CardDescription>Deal distribution by funding round</CardDescription>
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
        <CardTitle>Round Stage Distribution</CardTitle>
        <CardDescription>Deal distribution by funding round</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ stage, percentage }) => 
                  percentage > 8 ? `${stage}: ${percentage}%` : ''
                }
              >
                {data.map((entry, index) => (
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
