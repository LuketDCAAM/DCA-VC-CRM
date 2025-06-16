
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface DealVelocityChartProps {
  data: Array<{ month: string; deals: number; invested: number; averageTime?: number }>;
}

export function DealVelocityChart({ data }: DealVelocityChartProps) {
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

  // Calculate velocity metrics
  const totalDeals = data.reduce((sum, item) => sum + item.deals, 0);
  const totalInvested = data.reduce((sum, item) => sum + item.invested, 0);
  const conversionRate = totalDeals > 0 ? Math.round((totalInvested / totalDeals) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Velocity</CardTitle>
        <CardDescription>Deal flow and conversion trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {totalDeals}
            </p>
            <p className="text-sm text-muted-foreground">Total Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {totalInvested}
            </p>
            <p className="text-sm text-muted-foreground">Invested</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {conversionRate}%
            </p>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="deals"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
