
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getChartColor } from './shared/chartConfig';
import { Deal } from '@/types/deal';
import { format, subMonths, subWeeks, subDays, isAfter, parseISO } from 'date-fns';

interface ScoredDealsOverTimeChartProps {
  deals: Deal[];
}

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

function getCutoffDate(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '7d': return subDays(now, 7);
    case '30d': return subDays(now, 30);
    case '90d': return subDays(now, 90);
    case '6m': return subMonths(now, 6);
    case '1y': return subMonths(now, 12);
    case 'all': return null;
  }
}

function getGroupFormat(range: TimeRange): string {
  switch (range) {
    case '7d': return 'MMM dd';
    case '30d': return 'MMM dd';
    case '90d': return 'MMM yyyy';
    case '6m': return 'MMM yyyy';
    case '1y': return 'MMM yyyy';
    case 'all': return 'MMM yyyy';
  }
}

export function ScoredDealsOverTimeChart({ deals }: ScoredDealsOverTimeChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');

  const chartData = useMemo(() => {
    const cutoff = getCutoffDate(timeRange);
    const fmt = getGroupFormat(timeRange);

    const scored = deals.filter(d => {
      if (d.deal_score == null) return false;
      if (!d.created_at) return false;
      if (cutoff) {
        return isAfter(parseISO(d.created_at), cutoff);
      }
      return true;
    });

    const grouped: Record<string, number> = {};
    scored.forEach(d => {
      const key = format(parseISO(d.created_at), fmt);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    // Sort by date
    const entries = Object.entries(grouped).map(([period, count]) => ({ period, count }));
    entries.sort((a, b) => {
      // Parse back for sorting
      const dateA = scored.find(d => format(parseISO(d.created_at), fmt) === a.period)?.created_at || '';
      const dateB = scored.find(d => format(parseISO(d.created_at), fmt) === b.period)?.created_at || '';
      return dateA.localeCompare(dateB);
    });

    return entries;
  }, [deals, timeRange]);

  const chartConfig = {
    count: {
      label: 'Scored Deals',
      color: getChartColor(3),
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <div>
            <CardTitle>Scored Deals Over Time</CardTitle>
            <CardDescription>Number of deals with a scorecard by date created</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No scored deals in this time range</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[350px] w-full max-w-4xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill={getChartColor(3)}
                  name="Scored Deals"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
