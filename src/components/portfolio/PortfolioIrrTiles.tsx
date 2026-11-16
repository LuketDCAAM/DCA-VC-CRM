import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { computePortfolioIrr } from '@/lib/portfolio/irr';
import { usePortfolioCashFlows } from '@/hooks/portfolio/usePortfolioCashFlows';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';

const fmtPct = (v: number | null) => (v == null || !isFinite(v) ? '—' : `${(v * 100).toFixed(1)}%`);

export function PortfolioIrrTiles({ rows }: { rows: EnrichedPosition[] }) {
  const [asOf, setAsOf] = useState<Date>(new Date());
  const { data: cashFlows, isLoading } = usePortfolioCashFlows();
  const asOfStr = format(asOf, 'yyyy-MM-dd');

  const irr = useMemo(() => {
    if (!cashFlows) return { realized: null, unrealized: null };
    return computePortfolioIrr(
      rows.map((r) => ({
        companyId: r.company.id,
        status: r.position?.position_status,
        currentFmv: r.metrics.currentFmv,
        investments: r.company.investments,
      })),
      cashFlows,
      asOfStr,
    );
  }, [rows, cashFlows, asOfStr]);

  return (
    <div className="flex flex-wrap items-stretch gap-2 sm:gap-3 -mt-3 mb-6">
      {[
        { label: 'Realized IRR', hint: 'Exited positions', value: irr.realized },
        { label: 'Unrealized IRR', hint: 'Open positions at current FMV', value: irr.unrealized },
      ].map((t) => (
        <div key={t.label} className="rounded-lg border bg-card px-4 py-3 text-center min-w-[150px]" title={t.hint}>
          <p className="text-base sm:text-xl font-bold text-primary tabular-nums">{isLoading ? '…' : fmtPct(t.value)}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t.label}</p>
        </div>
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
    </div>
  );
}
