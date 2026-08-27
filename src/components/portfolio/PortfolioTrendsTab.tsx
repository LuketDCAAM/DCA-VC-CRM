import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatMoney, formatMultiple, formatNumber, formatPercent } from '@/lib/portfolio/metrics';
import {
  TREND_METRICS,
  buildMetricSeries,
  buildStepUpRows,
  buildValuationSeries,
  medianOf,
  type TrendMetric,
} from '@/lib/portfolio/timeseries';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';
import type { PortcoRound } from '@/hooks/portfolio/usePortcoRounds';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';

const SERIES_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface Props {
  positions: EnrichedPosition[];
  quartersByCompany: Map<string, PortcoQuarter[]>;
  roundsByCompany: Map<string, PortcoRound[]>;
}

export function PortfolioTrendsTab({ positions, quartersByCompany, roundsByCompany }: Props) {
  const [metric, setMetric] = useState<TrendMetric>('arr');
  const [indexed, setIndexed] = useState(false);

  const companies = useMemo(
    () => positions.map((p) => ({ id: p.company.id, company_name: p.company.company_name })),
    [positions],
  );

  const spec = TREND_METRICS.find((m) => m.key === metric)!;

  const { data: seriesData, keys } = useMemo(
    () => buildMetricSeries(companies, quartersByCompany, metric, indexed),
    [companies, quartersByCompany, metric, indexed],
  );

  const stepUpRows = useMemo(() => buildStepUpRows(companies, roundsByCompany), [companies, roundsByCompany]);

  const stepUpChartData = useMemo(
    () =>
      stepUpRows
        .filter((r) => r.stepUp != null && r.round.close_date)
        .sort((a, b) => (a.round.close_date ?? '').localeCompare(b.round.close_date ?? ''))
        .map((r) => ({
          label: `${r.companyName} ${r.round.round_name}`,
          stepUp: Number((r.stepUp as number).toFixed(2)),
        })),
    [stepUpRows],
  );

  const medianStepUp = medianOf(stepUpRows.map((r) => r.stepUp));

  const valuationSeries = useMemo(
    () =>
      buildValuationSeries(
        positions.map((p) => ({
          companyId: p.company.id,
          invested: p.metrics.totalInvested,
          realized: p.metrics.realizedProceeds,
          currentFmv: p.metrics.currentFmv,
          investmentDates: p.company.investments.map((i) => i.investment_date),
          investmentAmounts: p.company.investments.map((i) => i.amount_invested),
        })),
        quartersByCompany,
      ),
    [positions, quartersByCompany],
  );

  const formatValue = (value: number | null) => {
    if (value == null) return '—';
    if (indexed) return value.toFixed(0);
    if (spec.unit === 'money') return formatMoney(value);
    if (spec.unit === 'percent') return formatPercent(value);
    if (spec.unit === 'months') return `${value.toFixed(1)} mo`;
    return formatNumber(value);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Metrics over time</CardTitle>
            <CardDescription>Every reported quarter, company by company.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="indexed" checked={indexed} onCheckedChange={setIndexed} />
              <Label htmlFor="indexed" className="text-xs">
                Index to 100
              </Label>
            </div>
            <Select value={metric} onValueChange={(v) => setMetric(v as TrendMetric)}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TREND_METRICS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!seriesData.length ? (
            <p className="text-sm text-muted-foreground">
              No quarterly data yet — add quarters or import financials to see trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={seriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v: number) => formatValue(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [formatValue(value), name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {keys.map((k, i) => (
                  <Line
                    key={k.id}
                    type="monotone"
                    dataKey={k.id}
                    name={k.name}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Value over time</CardTitle>
          <CardDescription>
            Cumulative invested capital against marked fair value each quarter. Quarters without a valuation mark carry
            the last mark forward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!valuationSeries.length ? (
            <p className="text-sm text-muted-foreground">Record quarterly valuation marks to build FMV history.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valuationSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(v: number) => formatMoney(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [formatMoney(value), name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Invested"
                  stroke={SERIES_COLORS[1]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line type="monotone" dataKey="fmv" name="Fair value" stroke={SERIES_COLORS[0]} strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="realized"
                  name="Realized"
                  stroke={SERIES_COLORS[3]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Round step-ups</CardTitle>
          <CardDescription>
            Round-over-round price per share growth across the portfolio
            {medianStepUp != null ? ` — median ${formatMultiple(medianStepUp)}` : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepUpChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stepUpChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-25} textAnchor="end" height={80} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v: number) => `${v}x`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}x`, 'Step-up']}
                />
                <Bar dataKey="stepUp" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {!stepUpRows.length ? (
            <p className="text-sm text-muted-foreground">
              No rounds recorded yet. Add rounds per company (Portfolio → company → Valuation) or import them.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Post-money</TableHead>
                    <TableHead className="text-right">Step-up</TableHead>
                    <TableHead className="text-right">Vs. entry</TableHead>
                    <TableHead className="text-right">Months</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stepUpRows.map((r) => (
                    <TableRow key={r.round.id}>
                      <TableCell className="whitespace-nowrap font-medium">{r.companyName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.round.round_name}
                        {!r.round.we_participated && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            no participation
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.round.close_date ? new Date(r.round.close_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.round.post_money_valuation)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.stepUp == null ? (
                          '—'
                        ) : (
                          <span className={r.stepUp >= 1 ? 'text-emerald-600' : 'text-destructive'}>
                            {formatMultiple(r.stepUp)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMultiple(r.stepUpVsEntry)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.monthsSincePrior == null ? '—' : r.monthsSincePrior.toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
