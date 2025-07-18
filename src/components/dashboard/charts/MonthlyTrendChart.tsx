
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; deals: number; invested: number }>;
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
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Sourcing Trends</CardTitle>
        <CardDescription>Monthly deal sourcing activity based on source dates over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="deals" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Deals Sourced"
              />
              <Line 
                type="monotone" 
                dataKey="invested" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Invested"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
