import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney, formatMultiple, formatPercent } from '@/lib/portfolio/metrics';
import type { RollupRow } from '@/hooks/portfolio/usePortfolioRollups';

interface Props {
  title: string;
  description?: string;
  firstColumnLabel: string;
  rows: RollupRow[];
  showShare?: boolean;
}

export function RollupTable({ title, description, firstColumnLabel, rows, showShare = true }: Props) {
  const totals = rows.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      invested: acc.invested + r.invested,
      fmv: acc.fmv + r.fmv,
      realized: acc.realized + r.realized,
      unrealized: acc.unrealized + r.unrealized,
    }),
    { count: 0, invested: 0, fmv: 0, realized: 0, unrealized: 0 },
  );
  const totalMoic = totals.invested > 0 ? totals.fmv / totals.invested : null;
  const totalTvpi = totals.invested > 0 ? (totals.fmv + totals.realized) / totals.invested : null;
  const totalDpi = totals.invested > 0 ? totals.realized / totals.invested : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{firstColumnLabel}</TableHead>
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">FMV</TableHead>
              <TableHead className="text-right">Realized</TableHead>
              <TableHead className="text-right">Unrealized</TableHead>
              <TableHead className="text-right">MOIC</TableHead>
              <TableHead className="text-right">TVPI</TableHead>
              <TableHead className="text-right">DPI</TableHead>
              {showShare && <TableHead className="text-right">% of NAV</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={showShare ? 10 : 9} className="text-center text-muted-foreground">
                  No data yet
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.invested, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.fmv, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.realized, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.unrealized, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(row.moic)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(row.tvpi)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(row.dpi)}</TableCell>
                {showShare && (
                  <TableCell className="text-right tabular-nums">{formatPercent(row.shareOfNav)}</TableCell>
                )}
              </TableRow>
            ))}
            {rows.length > 0 && (
              <TableRow className="border-t-2 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{totals.count}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(totals.invested, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(totals.fmv, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(totals.realized, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(totals.unrealized, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(totalMoic)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(totalTvpi)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(totalDpi)}</TableCell>
                {showShare && <TableCell className="text-right tabular-nums">100.0%</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
