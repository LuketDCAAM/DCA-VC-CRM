
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface SectorChartProps {
  data: Array<{ sector: string; count: number; percentage: number }>;
}

export function SectorChart({ data }: SectorChartProps) {
  console.log('=== SECTOR CHART DEBUG ===');
  console.log('Received sector data:', data);

  // Define a color palette for the sectors
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', 
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'
  ];

  // Add colors to the data and limit to top 8
  const coloredData = data.slice(0, 8).map((item, index) => ({
    ...item,
    fill: colors[index % colors.length]
  }));

  console.log('Colored data for chart:', coloredData);

  // Simple chart config for the container
  const chartConfig = {
    count: {
      label: 'Deals',
      color: '#8884d8'
    }
  };

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Sectors</CardTitle>
          <CardDescription>Deal distribution by industry sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No sector data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sectors</CardTitle>
        <CardDescription>Deal distribution by industry sector (Top {Math.min(data.length, 8)})</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coloredData} layout="horizontal" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="sector" 
                width={75}
                fontSize={11}
                interval={0}
                tick={{ textAnchor: 'end' }}
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
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
