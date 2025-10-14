
import React from 'react';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { getChartColor } from '../shared/chartConfig';

interface ValuationRangesChartProps {
  data: Array<{ range: string; count: number }>;
}

export function ValuationRangesChart({ data }: ValuationRangesChartProps) {
  const chartConfig = {
    count: {
      label: 'Number of Deals',
      color: getChartColor(0)
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
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Bar 
              dataKey="count" 
              fill={getChartColor(0)}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
