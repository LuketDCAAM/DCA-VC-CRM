
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';

interface QuarterlyTrendData {
  quarter: string;
  averageValuation: number;
  medianValuation: number;
  dealCount: number;
}

interface QuarterlyValuationTrendChartProps {
  data: QuarterlyTrendData[];
}

export function QuarterlyValuationTrendChart({ data }: QuarterlyValuationTrendChartProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount / 100);
  };

  const chartConfig = {
    averageValuation: {
      label: 'Average Valuation',
      color: '#8884d8'
    },
    medianValuation: {
      label: 'Median Valuation',
      color: '#82ca9d'
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quarterly Valuation Trends</CardTitle>
        <CardDescription>Average and median valuations by quarter over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="quarter" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                fontSize={12}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-[#8884d8]">●</span> Average: {formatCurrency(data.averageValuation)}
                          </p>
                          <p className="text-sm">
                            <span className="text-[#82ca9d]">●</span> Median: {formatCurrency(data.medianValuation)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {data.dealCount} deals
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageValuation" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Average Valuation"
              />
              <Line 
                type="monotone" 
                dataKey="medianValuation" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Median Valuation"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
