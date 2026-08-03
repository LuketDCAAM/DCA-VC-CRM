import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getChartColor } from '../shared/chartConfig';

interface ValuationRangesChartProps {
  data: Array<{ range: string; count: number }>;
}

export function ValuationRangesChart({ data }: ValuationRangesChartProps) {
  const chartConfig = {
    count: {
      label: 'Number of Deals',
      color: getChartColor(0),
    },
  };

  const hasData = data.some((d) => d.count > 0);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Distribution by Valuation Range</h3>
      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11 }}
                interval={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const count = payload[0].value as number;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        {count} deal{count === 1 ? '' : 's'}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" fill={getChartColor(0)} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
          No valuations in range
        </div>
      )}
    </div>
  );
}
