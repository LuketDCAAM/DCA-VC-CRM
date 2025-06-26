
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { QuarterlyValuationTrendChart } from './QuarterlyValuationTrendChart';

interface ValuationAnalysis {
  averageValuation: number;
  medianValuation: number;
  totalDealValue: number;
  valuationRanges: Array<{ range: string; count: number }>;
  quarterlyTrends: Array<{ 
    quarter: string; 
    averageValuation: number; 
    medianValuation: number; 
    dealCount: number 
  }>;
}

interface ValuationChartProps {
  data: ValuationAnalysis;
}

export function ValuationChart({ data }: ValuationChartProps) {
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
    count: {
      label: 'Number of Deals',
      color: '#8884d8'
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Valuation Analysis</CardTitle>
          <CardDescription>Deal distribution by valuation ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.averageValuation)}
              </p>
              <p className="text-sm text-muted-foreground">Average Valuation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.medianValuation)}
              </p>
              <p className="text-sm text-muted-foreground">Median Valuation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(data.totalDealValue)}
              </p>
              <p className="text-sm text-muted-foreground">Total Deal Value</p>
            </div>
          </div>
          
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.valuationRanges}>
                <XAxis 
                  dataKey="range" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.range}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.count} deals
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
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {data.quarterlyTrends && data.quarterlyTrends.length > 0 && (
        <QuarterlyValuationTrendChart data={data.quarterlyTrends} />
      )}
    </div>
  );
}
