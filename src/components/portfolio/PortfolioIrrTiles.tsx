import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { computeIrrBreakdown } from '@/lib/portfolio/irr';
import { usePortfolioCashFlows } from '@/hooks/portfolio/usePortfolioCashFlows';
import { PortfolioIrrBreakdownDialog } from './PortfolioIrrBreakdownDialog';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';

const fmtPct = (v: number | null) => (v == null || !isFinite(v) ? '—' : `${(v * 100).toFixed(1)}%`);

export function PortfolioIrrTiles({
  rows,
  onOpenCompany,
}: {
  rows: EnrichedPosition[];
  onOpenCompany?: (companyId: string) => void;
}) {
  const [asOf, setAsOf] = useState<Date>(new Date());
  const [openMode, setOpenMode] = useState<'realized' | 'gross' | null>(null);
  const { data: cashFlows, isLoading } = usePortfolioCashFlows();
  const asOfStr = format(asOf, 'yyyy-MM-dd');

  const breakdown = useMemo(() => {
    if (!cashFlows) return null;
    return computeIrrBreakdown(
      rows.map((r) => ({
        companyId: r.company.id,
        companyName: r.company.company_name,
        status: r.position?.position_status,
        currentFmv: r.metrics.currentFmv,
        invested: r.metrics.totalInvested,
        realized: r.metrics.realizedProceeds,
        investments: r.company.investments,
      })),
      cashFlows,
      asOfStr,
    );
  }, [rows, cashFlows, asOfStr]);

  const tiles = [
    { mode: 'realized' as const, label: 'Realized IRR', hint: 'Exited positions', value: breakdown?.realized ?? null },
    {
      mode: 'gross' as const,
      label: 'Gross IRR',
      hint: 'All positions: every cash flow plus open positions at current FMV',
      value: breakdown?.total ?? null,
    },
  ];

  return (
    <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 -mt-3 mb-6">
      {tiles.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => setOpenMode(t.mode)}
          title={`${t.hint} — click for the per-company breakdown`}
          className="rounded-lg border bg-card px-4 py-3 text-center min-w-[150px] transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <p className="text-base sm:text-xl font-bold text-primary tabular-nums">
            {isLoading ? '…' : fmtPct(t.value)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t.label}</p>
        </button>
      ))}
      <div className="flex flex-col justify-center gap-1">
        <span className="text-xs text-muted-foreground">As of</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('justify-start font-normal')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(asOf, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={asOf}
              onSelect={(d) => d && setAsOf(d)}
              disabled={(d) => d > new Date()}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {breakdown && openMode && (
        <PortfolioIrrBreakdownDialog
          open
          onOpenChange={(o) => !o && setOpenMode(null)}
          breakdown={breakdown}
          asOf={asOfStr}
          mode={openMode}
          onOpenCompany={
            onOpenCompany
              ? (id) => {
                  setOpenMode(null);
                  onOpenCompany(id);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
