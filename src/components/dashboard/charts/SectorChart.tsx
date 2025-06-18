
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

  // Filter out any invalid data and limit to top 8
  const validData = data?.filter(item => 
    item && 
    typeof item.sector === 'string' && 
    item.sector.trim() !== '' &&
    typeof item.count === 'number' && 
    item.count > 0
  ) || [];

  console.log('Valid data count:', validData.length);

  // Simple chart config for the container
  const chartConfig = {
    count: {
      label: 'Deals',
      color: '#8884d8'
    }
  };

  if (!validData.length) {
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

  // Prepare data for horizontal bar chart - limit to top 8
  const chartData = validData.slice(0, 8);
  console.log('Chart data prepared:', chartData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sectors</CardTitle>
        <CardDescription>Deal distribution by industry sector (Top {chartData.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="horizontal" 
              margin={{ left: 100, right: 20, top: 10, bottom: 10 }}
            >
              <XAxis 
                type="number" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                domain={[0, 'dataMax']}
              />
              <YAxis 
                type="category" 
                dataKey="sector" 
                width={90}
                fontSize={12}
                interval={0}
                tick={{ textAnchor: 'end', fontSize: 12, fill: '#666' }}
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
