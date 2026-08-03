import React from 'react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatCurrencyCompact } from './valuationUtils';
import { getChartColor } from '../shared/chartConfig';

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
      label: 'Average',
      color: getChartColor(0),
    },
    medianValuation: {
      label: 'Median',
      color: getChartColor(1),
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Quarterly Valuation Trends</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getChartColor(0) }}
            />
            Average
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getChartColor(1) }}
            />
            Median
          </span>
        </div>
      </div>

      {data && data.length > 0 ? (
        <ChartContainer config={trendsChartConfig} className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="quarter"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as QuarterlyTrendData;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{label}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span style={{ color: getChartColor(0) }}>●</span> Average:{' '}
                          {formatCurrency(point.averageValuation)}
                        </p>
                        <p className="text-sm">
                          <span style={{ color: getChartColor(1) }}>●</span> Median:{' '}
                          {formatCurrency(point.medianValuation)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {point.dealCount} deal{point.dealCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="averageValuation"
                stroke={getChartColor(0)}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Average Valuation"
              />
              <Line
                type="monotone"
                dataKey="medianValuation"
                stroke={getChartColor(1)}
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Median Valuation"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
          Not enough dated valuations to show a trend
        </div>
      )}
    </div>
  );
}
