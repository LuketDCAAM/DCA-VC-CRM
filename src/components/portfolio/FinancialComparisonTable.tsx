import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Download } from 'lucide-react';
import { formatMoney, formatMultiple, formatNumber, formatPercent } from '@/lib/portfolio/metrics';
import { buildComparisonRows, median, type ComparisonRow } from '@/lib/portfolio/comparison';
import { PerformanceStatusBadge } from '@/components/portfolio/PerformanceStatusBadge';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';
import type { PeriodOption } from '@/hooks/portfolio/useAllPortcoQuarters';
import type { PortfolioCompany } from '@/hooks/usePortfolioCompanies';

type Fmt = 'money' | 'percent' | 'number' | 'multiple' | 'months';

interface Column {
  key: keyof ComparisonRow;
  label: string;
  fmt: Fmt;
  agg: 'sum' | 'median' | 'none';
}

const COLUMNS: Column[] = [
  { key: 'arr', label: 'ARR', fmt: 'money', agg: 'sum' },
  { key: 'arrQoQ', label: 'ARR QoQ', fmt: 'percent', agg: 'median' },
  { key: 'arrYoY', label: 'ARR YoY', fmt: 'percent', agg: 'median' },
  { key: 'revenue', label: 'Revenue (Q)', fmt: 'money', agg: 'sum' },
  { key: 'grossMargin', label: 'Gross margin', fmt: 'percent', agg: 'median' },
  { key: 'netBurn', label: 'Net burn / mo', fmt: 'money', agg: 'sum' },
  { key: 'cash', label: 'Cash', fmt: 'money', agg: 'sum' },
  { key: 'runway', label: 'Runway', fmt: 'months', agg: 'median' },
  { key: 'burnMultiple', label: 'Burn multiple', fmt: 'multiple', agg: 'median' },
  { key: 'nrr', label: 'NRR', fmt: 'percent', agg: 'median' },
  { key: 'churn', label: 'Churn / mo', fmt: 'percent', agg: 'median' },
  { key: 'headcount', label: 'Headcount', fmt: 'number', agg: 'sum' },
  { key: 'arrPerHead', label: 'ARR / head', fmt: 'money', agg: 'median' },
  { key: 'capitalEfficiency', label: 'ARR / invested', fmt: 'multiple', agg: 'median' },
  { key: 'fmvToArr', label: 'FMV / ARR', fmt: 'multiple', agg: 'median' },
  { key: 'moic', label: 'MOIC', fmt: 'multiple', agg: 'median' },
];

function render(value: number | null | undefined, fmt: Fmt): string {
  switch (fmt) {
    case 'money':
      return formatMoney(value);
    case 'percent':
      return formatPercent(value);
    case 'number':
      return formatNumber(value);
    case 'multiple':
      return formatMultiple(value);
    case 'months':
      return value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)} mo`;
  }
}

function rawExport(value: number | null | undefined, fmt: Fmt): string {
  if (value == null || !Number.isFinite(value)) return '';
  if (fmt === 'money') return String(value / 100);
  if (fmt === 'percent') return String(Number((value * 100).toFixed(4)));
  return String(Number(value.toFixed(4)));
}

interface Props {
  positions: EnrichedPosition[];
  quartersByCompany: Map<string, PortcoQuarter[]>;
  periods: PeriodOption[];
  onViewDetails: (company: PortfolioCompany) => void;
}

export function FinancialComparisonTable({ positions, quartersByCompany, periods, onViewDetails }: Props) {
  const [periodKey, setPeriodKey] = useState<string>('latest');
  const [sortKey, setSortKey] = useState<keyof ComparisonRow>('arr');
  const [asc, setAsc] = useState(false);

  const period = useMemo(() => {
    const found = periods.find((p) => p.key === periodKey);
    return found ? { fiscal_year: found.fiscal_year, fiscal_quarter: found.fiscal_quarter } : null;
  }, [periodKey, periods]);

  const rows = useMemo(() => buildComparisonRows(positions, quartersByCompany, period), [positions, quartersByCompany, period]);

  const reported = useMemo(() => rows.filter((r) => r.periodLabel != null), [rows]);
  const missing = rows.length - reported.length;

  const sorted = useMemo(() => {
    return [...reported].sort((a, b) => {
      if (sortKey === 'companyName') {
        const cmp = a.companyName.localeCompare(b.companyName);
        return asc ? cmp : -cmp;
      }
      const av = a[sortKey] as number | null;
      const bv = b[sortKey] as number | null;
      const an = av == null || !Number.isFinite(av) ? Number.NEGATIVE_INFINITY : av;
      const bn = bv == null || !Number.isFinite(bv) ? Number.NEGATIVE_INFINITY : bv;
      return asc ? an - bn : bn - an;
    });
  }, [reported, sortKey, asc]);

  const toggle = (key: keyof ComparisonRow) => {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === 'companyName');
    }
  };

  const handleExport = () => {
    const header = ['Company', 'Period', 'Vehicle', 'Sector', ...COLUMNS.map((c) => c.label), 'Status'];
    const lines = sorted.map((r) => [
      r.companyName,
      r.periodLabel ?? '',
      r.vehicle ?? '',
      r.sector ?? '',
      ...COLUMNS.map((c) => rawExport(r[c.key] as number | null, c.fmt)),
      r.status,
    ]);
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-financials-${periodKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const footer = COLUMNS.map((c) => {
    const values = sorted.map((r) => r[c.key] as number | null);
    if (c.agg === 'sum') return { column: c, value: values.some((v) => v != null) ? values.reduce((a, v) => a + (v ?? 0), 0) : null, label: 'Total' };
    if (c.agg === 'median') return { column: c, value: median(values), label: 'Median' };
    return { column: c, value: null, label: '' };
  });

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="text-base">Financial comparison</CardTitle>
          <CardDescription>
            Latest reported quarter per company, side by side. Totals sum balance-sheet items; ratios show the portfolio median.
            {missing > 0 && ` ${missing} compan${missing === 1 ? 'y has' : 'ies have'} no data for this period.`}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodKey} onValueChange={setPeriodKey}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest reported</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  As of {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!sorted.length}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card">
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggle('companyName')}>
                  Company <ArrowUpDown className="h-3 w-3 opacity-60" />
                </button>
              </TableHead>
              <TableHead>Period</TableHead>
              {COLUMNS.map((c) => (
                <TableHead key={String(c.key)} className="text-right whitespace-nowrap">
                  <button
                    className="inline-flex items-center gap-1 justify-end w-full hover:text-foreground"
                    onClick={() => toggle(c.key)}
                  >
                    {c.label}
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </TableHead>
              ))}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 3} className="text-center text-muted-foreground">
                  No quarterly financials recorded yet. Add quarterly KPIs from a company's detail view.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((r) => {
              const company = positions.find((p) => p.company.id === r.companyId)?.company;
              return (
                <TableRow key={r.companyId}>
                  <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-card">
                    <button
                      className="hover:underline text-left"
                      onClick={() => company && onViewDetails(company)}
                    >
                      {r.companyName}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{r.periodLabel ?? '—'}</TableCell>
                  {COLUMNS.map((c) => (
                    <TableCell key={String(c.key)} className="text-right tabular-nums whitespace-nowrap">
                      {render(r[c.key] as number | null, c.fmt)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <PerformanceStatusBadge status={r.status} reasons={r.statusReasons} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {sorted.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium sticky left-0 bg-muted">Portfolio</TableCell>
                <TableCell />
                {footer.map(({ column, value, label }) => (
                  <TableCell key={String(column.key)} className="text-right tabular-nums whitespace-nowrap">
                    {value == null ? '—' : render(value, column.fmt)}
                    {value != null && label && <span className="block text-[10px] text-muted-foreground">{label}</span>}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  );
}
