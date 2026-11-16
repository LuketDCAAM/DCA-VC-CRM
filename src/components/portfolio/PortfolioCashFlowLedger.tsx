import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMoney } from '@/lib/portfolio/metrics';
import type { LedgerEntry } from '@/lib/portfolio/irr';

interface Props {
  entries: LedgerEntry[];
  asOf: string;
  compact?: boolean;
}

const KIND_LABEL: Record<LedgerEntry['kind'], string> = {
  investment: 'Investment',
  cash_flow: 'Cash flow',
  terminal: 'Marked value',
};

export function PortfolioCashFlowLedger({ entries, asOf, compact = false }: Props) {
  if (!entries.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No dated cash flows yet. Add investment dates or cash-flow rows to see the math behind the IRR.
      </p>
    );
  }

  const excluded = entries.filter((e) => !e.included).length;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <Table className={compact ? 'text-xs' : 'text-sm'}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Net position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => (
              <TableRow key={`${e.date}-${e.label}-${i}`} className={e.included ? '' : 'opacity-50'}>
                <TableCell className="tabular-nums whitespace-nowrap">
                  {new Date(`${e.date}T00:00:00`).toLocaleDateString()}
                  {e.dateIsEstimated && <span className="ml-1 text-[10px] text-muted-foreground">est.</span>}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{e.label}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {KIND_LABEL[e.kind]}
                  </span>
                  {e.description && <span className="block text-xs text-muted-foreground">{e.description}</span>}
                  {!e.included && (
                    <span className="block text-[10px] text-muted-foreground">after {asOf} — not counted</span>
                  )}
                </TableCell>
                <TableCell className={`text-right tabular-nums ${e.amount < 0 ? 'text-destructive' : ''}`}>
                  {e.amount < 0 ? `-${formatMoney(Math.abs(e.amount))}` : formatMoney(e.amount)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {e.included ? formatMoney(e.running) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {excluded > 0 && (
        <p className="text-xs text-muted-foreground">
          {excluded} row{excluded === 1 ? '' : 's'} dated after {asOf} are shown for context but excluded from the IRR.
        </p>
      )}
    </div>
  );
}
