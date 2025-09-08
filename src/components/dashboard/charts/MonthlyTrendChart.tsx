
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; deals: number; invested: number; firstCalls: number }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const chartConfig = {
    deals: {
      label: 'New Deals',
      color: '#8884d8'
    },
    invested: {
      label: 'Invested',
      color: '#82ca9d'
    },
    firstCalls: {
      label: 'First Calls',
      color: '#ff7300'
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Sourcing Trends</CardTitle>
        <CardDescription>Monthly deal sourcing activity based on source dates over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-[400px] w-full max-w-4xl">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar 
                dataKey="deals" 
                fill="#8884d8" 
                name="Deals Sourced" 
                yAxisId="left" 
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="invested" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Invested"
                yAxisId="right"
              />
              <Line 
                type="monotone" 
                dataKey="firstCalls" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="First Calls"
                yAxisId="right"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
