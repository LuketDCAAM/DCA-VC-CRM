import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortcoQuarters } from '@/hooks/portfolio/usePortcoQuarters';
import { comparePeriods, formatMoney, formatPercent, periodLabel } from '@/lib/portfolio/metrics';

interface Props {
  companyId: string;
}

/** Quarterly valuation marks for one company: FMV over time plus the mark log. */
export function PortcoValuationHistory({ companyId }: Props) {
  const { quarters, loading } = usePortcoQuarters(companyId);

  const marks = useMemo(
    () =>
      [...quarters]
        .sort(comparePeriods)
        .filter((q) => q.our_fmv != null || q.company_valuation != null),
    [quarters],
  );

  const chartData = useMemo(
    () =>
      marks.map((q) => ({
        period: periodLabel(q.fiscal_year, q.fiscal_quarter),
        fmv: q.our_fmv ?? null,
        valuation: q.company_valuation ?? null,
      })),
    [marks],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Valuation history</CardTitle>
        <CardDescription>
          Quarterly marks recorded on the Quarterly KPIs tab — company valuation, our ownership and our fair value.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading marks…</p>
        ) : !marks.length ? (
          <p className="text-sm text-muted-foreground">
            No valuation marks yet. Add a quarter and fill in the valuation mark section.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
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
                  dataKey="valuation"
                  name="Company valuation"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="fmv"
                  name="Our fair value"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Mark date</TableHead>
                    <TableHead className="text-right">Company valuation</TableHead>
                    <TableHead className="text-right">Ownership</TableHead>
                    <TableHead className="text-right">Our fair value</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...marks].reverse().map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {periodLabel(q.fiscal_year, q.fiscal_quarter)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {q.mark_date ? new Date(q.mark_date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(q.company_valuation)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(q.ownership_pct)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(q.our_fmv)}</TableCell>
                      <TableCell>{q.mark_method ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
