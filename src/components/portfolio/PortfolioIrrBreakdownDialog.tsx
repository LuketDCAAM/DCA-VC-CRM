import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney, formatPercent } from '@/lib/portfolio/metrics';
import { buildCashFlowLedger, type IrrBreakdown, type CompanyIrrRow } from '@/lib/portfolio/irr';
import { PortfolioCashFlowLedger } from './PortfolioCashFlowLedger';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: IrrBreakdown;
  asOf: string;
  mode: 'realized' | 'gross';
  onOpenCompany?: (companyId: string) => void;
}

export function PortfolioIrrBreakdownDialog({ open, onOpenChange, breakdown, asOf, mode, onOpenCompany }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = mode === 'realized' ? breakdown.rows.filter((r) => r.countedInRealized) : breakdown.rows;
  const headline = mode === 'realized' ? breakdown.realized : breakdown.total;

  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'realized' ? 'Realized IRR' : 'Gross IRR'} — by company</DialogTitle>
          <DialogDescription>
            Portfolio {mode === 'realized' ? 'realized' : 'gross'} IRR {formatPercent(headline)} as of {asOf}.
            Each row is that company's own money-weighted return; click a row to see the dated cash flows behind it.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">FMV</TableHead>
                <TableHead className="text-right">Realized</TableHead>
                <TableHead className="text-right">IRR</TableHead>
                <TableHead className="text-right">Flows from</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No companies with dated cash flows yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r: CompanyIrrRow) => (
                <React.Fragment key={r.companyId}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggle(r.companyId)}
                    aria-expanded={expanded === r.companyId}
                  >
                    <TableCell className="font-medium">{r.companyName}</TableCell>
                    <TableCell>
                      <Badge variant={r.exited ? 'secondary' : 'outline'}>{r.status ?? 'Unclassified'}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.invested)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.fmv)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.realized)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatPercent(r.irr, 'no flows')}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {r.source === 'cash_flows' ? 'cash-flow rows' : 'investment dates'}
                    </TableCell>
                  </TableRow>
                  {expanded === r.companyId && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/40">
                        <div className="space-y-3 py-2">
                          <PortfolioCashFlowLedger
                            compact
                            asOf={asOf}
                            entries={buildCashFlowLedger(
                              {
                                companyId: r.companyId,
                                status: r.status,
                                currentFmv: r.fmv,
                                investments: [],
                              },
                              r.baseFlows,
                              asOf,
                            )}
                          />
                          {onOpenCompany && (
                            <Button variant="outline" size="sm" onClick={() => onOpenCompany(r.companyId)}>
                              Open {r.companyName}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
