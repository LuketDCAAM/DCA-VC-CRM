
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface ConversionMetrics {
  overallConversionRate: number;
  stageConversionRates: Array<{ from: string; to: string; rate: number }>;
}

interface ConversionChartProps {
  data: ConversionMetrics;
}

export function ConversionChart({ data }: ConversionChartProps) {
  const chartConfig = {
    rate: {
      label: 'Conversion Rate (%)',
      color: '#82ca9d'
    }
  };

  const chartData = data.stageConversionRates.map(item => ({
    stage: `${item.from} → ${item.to}`,
    rate: item.rate
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Stage-to-stage conversion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-primary">
            {data.overallConversionRate}%
          </p>
          <p className="text-sm text-muted-foreground">Overall Conversion Rate</p>
        </div>
        
        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="stage" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.stage}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.rate}% conversion rate
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="rate" 
                fill="#82ca9d"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
