
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

  // Filter out any invalid data and limit to top 8
  const validData = data.filter(item => 
    item && 
    typeof item.sector === 'string' && 
    item.sector.trim() !== '' &&
    typeof item.count === 'number' && 
    item.count > 0
  );

  // Add colors to the data and limit to top 8
  const coloredData = validData.slice(0, 8).map((item, index) => ({
    ...item,
    fill: colors[index % colors.length]
  }));

  console.log('Processed data for chart:', coloredData);

  // Simple chart config for the container
  const chartConfig = {
    count: {
      label: 'Deals',
      color: '#8884d8'
    }
  };

  if (!coloredData.length) {
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
        <CardDescription>Deal distribution by industry sector (Top {coloredData.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={coloredData} 
              layout="horizontal" 
              margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
            >
              <XAxis 
                type="number" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                type="category" 
                dataKey="sector" 
                width={75}
                fontSize={11}
                interval={0}
                tick={{ textAnchor: 'end', fontSize: 11, fill: '#666' }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
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
                fill="#8884d8"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
