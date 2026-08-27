import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, Eye } from 'lucide-react';
import { formatMoney, formatMultiple, formatPercent } from '@/lib/portfolio/metrics';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';
import type { PortfolioCompany } from '@/hooks/usePortfolioCompanies';

type SortKey = 'company' | 'invested' | 'fmv' | 'realized' | 'moic' | 'tvpi' | 'vintage';

interface Props {
  rows: EnrichedPosition[];
  onViewDetails: (company: PortfolioCompany) => void;
}

export function PositionsTable({ rows, onViewDetails }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('fmv');
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const value = (r: EnrichedPosition): number | string => {
      switch (sortKey) {
        case 'company':
          return r.company.company_name.toLowerCase();
        case 'invested':
          return r.metrics.totalInvested;
        case 'fmv':
          return r.metrics.currentFmv;
        case 'realized':
          return r.metrics.realizedProceeds;
        case 'moic':
          return r.metrics.moic ?? -1;
        case 'tvpi':
          return r.metrics.tvpi ?? -1;
        case 'vintage':
          return r.metrics.vintage ?? 0;
      }
    };
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number);
      return asc ? cmp : -cmp;
    });
  }, [rows, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === 'company');
    }
  };

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'right') => (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        className={`inline-flex items-center gap-1 hover:text-foreground ${align === 'right' ? 'justify-end w-full' : ''}`}
        onClick={() => toggle(key)}
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </TableHead>
  );

  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {header('company', 'Company', 'left')}
              <TableHead>Vehicle</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Status</TableHead>
              {header('vintage', 'Vintage')}
              {header('invested', 'Invested')}
              {header('fmv', 'FMV')}
              {header('realized', 'Realized')}
              {header('moic', 'MOIC')}
              {header('tvpi', 'TVPI')}
              <TableHead className="text-right">Own %</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  No positions match the current filters.
                </TableCell>
              </TableRow>
            )}
            {sorted.map(({ company, position, metrics }) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium whitespace-nowrap">{company.company_name}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {position?.vehicle ?? '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{position?.sector ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="outline">{position?.position_status ?? company.status}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{metrics.vintage ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(metrics.totalInvested, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(metrics.currentFmv, '$0')}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(metrics.realizedProceeds, '$0')}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(metrics.moic)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMultiple(metrics.tvpi)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(position?.ownership_pct ?? company.current_valuation?.current_ownership_percentage)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onViewDetails(company)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
