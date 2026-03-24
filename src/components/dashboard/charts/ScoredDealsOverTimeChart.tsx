
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { getChartColor } from './shared/chartConfig';
import { Deal } from '@/types/deal';
import { format, subMonths, subDays, isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoredDealsOverTimeChartProps {
  deals: Deal[];
}

type TimeRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'all' | 'custom';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

function getCutoffDate(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '7d': return subDays(now, 7);
    case '30d': return subDays(now, 30);
    case '90d': return subDays(now, 90);
    case '6m': return subMonths(now, 6);
    case '1y': return subMonths(now, 12);
    default: return null;
  }
}

function getGroupFormat(days: number): string {
  if (days <= 31) return 'MMM dd';
  return 'MMM yyyy';
}

export function ScoredDealsOverTimeChart({ deals }: ScoredDealsOverTimeChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6m');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);

  const chartData = useMemo(() => {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (timeRange === 'custom') {
      startDate = customFrom || null;
      endDate = customTo || null;
    } else {
      startDate = getCutoffDate(timeRange);
    }

    const days = startDate && endDate
      ? differenceInDays(endDate, startDate)
      : startDate
        ? differenceInDays(new Date(), startDate)
        : 365;

    const fmt = getGroupFormat(days);

    const scored = deals.filter(d => {
      if (d.deal_score == null) return false;
      if (d.deal_score < scoreRange[0] || d.deal_score > scoreRange[1]) return false;
      const dateStr = d.scored_at || d.created_at;
      if (!dateStr) return false;
      const date = parseISO(dateStr);
      if (startDate && !isAfter(date, startDate)) return false;
      if (endDate && !isBefore(date, endDate)) return false;
      return true;
    });

    const grouped: Record<string, number> = {};
    scored.forEach(d => {
      const dateStr = d.scored_at || d.created_at;
      const key = format(parseISO(dateStr), fmt);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    const entries = Object.entries(grouped).map(([period, count]) => ({ period, count }));
    entries.sort((a, b) => {
      const dateA = scored.find(d => format(parseISO(d.scored_at || d.created_at), fmt) === a.period)?.scored_at || scored.find(d => format(parseISO(d.scored_at || d.created_at), fmt) === a.period)?.created_at || '';
      const dateB = scored.find(d => format(parseISO(d.scored_at || d.created_at), fmt) === b.period)?.scored_at || scored.find(d => format(parseISO(d.scored_at || d.created_at), fmt) === b.period)?.created_at || '';
      return dateA.localeCompare(dateB);
    });

    return entries;
  }, [deals, timeRange, customFrom, customTo, scoreRange]);

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
          <div className="flex items-center gap-2 flex-wrap">
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
        </div>

        {/* Custom date pickers */}
        {timeRange === 'custom' && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal text-sm", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                  {customFrom ? format(customFrom, "MMM dd, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal text-sm", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                  {customTo ? format(customTo, "MMM dd, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Score filter */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Score: {scoreRange[0]}–{scoreRange[1]}</span>
          <Slider
            min={0}
            max={100}
            step={5}
            value={scoreRange}
            onValueChange={(v) => setScoreRange(v as [number, number])}
            className="w-[200px]"
          />
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No scored deals in this range</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[350px] w-full max-w-4xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={getChartColor(3)} name="Scored Deals" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
