
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface SectorChartProps {
  data: Array<{ sector: string; count: number; percentage: number }>;
}

export function SectorChart({ data }: SectorChartProps) {
  const chartConfig = data.reduce((config, item, index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
    config[item.sector] = {
      label: item.sector,
      color: colors[index % colors.length]
    };
    return config;
  }, {} as any);

  const topSectors = data.slice(0, 8); // Show top 8 sectors

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sectors</CardTitle>
        <CardDescription>Deal distribution by industry sector</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSectors} layout="horizontal">
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="sector" 
                width={100}
                fontSize={12}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.sector}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} deals ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
