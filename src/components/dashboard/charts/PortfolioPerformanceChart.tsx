
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface PortfolioPerformanceProps {
  portfolioCount: number;
  totalInvested: number;
  averageInvestment?: number;
  performanceData?: Array<{ 
    month: string; 
    investments: number; 
    totalValue: number; 
    companies: number;
  }>;
}

export function PortfolioPerformanceChart({ 
  portfolioCount, 
  totalInvested, 
  averageInvestment = 0,
  performanceData = []
}: PortfolioPerformanceProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const chartConfig = {
    investments: {
      label: 'Total Invested',
      color: '#8884d8'
    },
    companies: {
      label: 'Portfolio Companies',
      color: '#82ca9d'
    }
  };

  // Generate sample performance data if none provided
  const displayData = performanceData.length > 0 ? performanceData : 
    Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        investments: Math.floor(totalInvested * (0.7 + (i * 0.05))),
        totalValue: Math.floor(totalInvested * (0.8 + (i * 0.1))),
        companies: Math.max(1, portfolioCount - Math.floor((5 - i) / 2))
      };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>Investment and portfolio company growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {portfolioCount}
            </p>
            <p className="text-sm text-muted-foreground">Portfolio Companies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalInvested)}
            </p>
            <p className="text-sm text-muted-foreground">Total Invested</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {portfolioCount > 0 ? formatCurrency(totalInvested / portfolioCount) : '$0'}
            </p>
            <p className="text-sm text-muted-foreground">Avg Investment</p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData}>
              <XAxis 
                dataKey="month" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-blue-600">
                          Invested: {formatCurrency(payload[0]?.value || 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          Companies: {payload[1]?.value || 0}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                yAxisId="left"
                dataKey="investments" 
                fill="#8884d8" 
                fillOpacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="companies"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={{ fill: '#82ca9d', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
