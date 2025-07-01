
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

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

  const formatCurrencyCompact = (amount: number) => {
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
    count: {
      label: 'Number of Deals',
      color: '#8884d8'
    }
  };

  const trendsChartConfig = {
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
        <CardTitle>Valuation Analysis</CardTitle>
        <CardDescription>Deal distribution by valuation ranges and quarterly trends</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4">
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
        
        {/* Valuation Ranges Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Distribution by Valuation Range</h3>
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
        </div>

        {/* Quarterly Trends Chart */}
        {data.quarterlyTrends && data.quarterlyTrends.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Quarterly Valuation Trends</h3>
            <ChartContainer config={trendsChartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.quarterlyTrends}>
                  <XAxis 
                    dataKey="quarter" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickFormatter={formatCurrencyCompact}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
