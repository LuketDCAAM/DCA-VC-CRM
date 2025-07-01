
import React from 'react';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface ValuationRangesChartProps {
  data: Array<{ range: string; count: number }>;
}

export function ValuationRangesChart({ data }: ValuationRangesChartProps) {
  const chartConfig = {
    count: {
      label: 'Number of Deals',
      color: '#8884d8'
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Distribution by Valuation Range</h3>
      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="range" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Bar 
              dataKey="count" 
              fill="#8884d8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
