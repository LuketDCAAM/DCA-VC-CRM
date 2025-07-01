
import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatCurrencyCompact } from './valuationUtils';

interface QuarterlyTrendData {
  quarter: string;
  averageValuation: number;
  medianValuation: number;
  dealCount: number;
}

interface QuarterlyValuationTrendsChartProps {
  data: QuarterlyTrendData[];
}

export function QuarterlyValuationTrendsChart({ data }: QuarterlyValuationTrendsChartProps) {
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

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Quarterly Valuation Trends</h3>
      <ChartContainer config={trendsChartConfig} className="h-[300px]">
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
  );
}
