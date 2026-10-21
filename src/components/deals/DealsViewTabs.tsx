import React, { useMemo } from 'react';
import { List, Kanban } from 'lucide-react';
import { ViewMode } from './views/DealsViewRenderer';
import { Deal } from '@/types/deal';
import { cn } from '@/lib/utils';

interface DealsViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dealCount: number;
  deals?: Deal[];
}

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const VIEWS: { value: ViewMode; label: string; icon: typeof List }[] = [
  { value: 'configurable', label: 'List', icon: List },
  { value: 'kanban', label: 'Pipeline', icon: Kanban },
];

export function DealsViewTabs({ viewMode, onViewModeChange, dealCount, deals = [] }: DealsViewTabsProps) {
  const stats = useMemo(() => {
    const scored = deals.filter((d) => typeof d.deal_score === 'number' && d.deal_score > 0);
    const totalRound = deals.reduce((sum, d) => sum + (d.round_size ?? 0), 0);
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = deals.filter((d) => new Date(d.created_at).getTime() >= monthAgo).length;
    const avgScore = scored.length
      ? Math.round(scored.reduce((s, d) => s + (d.deal_score as number), 0) / scored.length)
      : null;
    return [
      { label: 'Deals in view', value: dealCount.toLocaleString() },
      { label: 'Added last 30 days', value: recent.toLocaleString() },
      { label: 'Total round size', value: totalRound ? compactMoney.format(totalRound / 100) : '—' },
      { label: 'Avg. score', value: avgScore != null ? String(avgScore) : '—' },
    ];
  }, [deals, dealCount]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:gap-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card px-3 py-2 md:border-0 md:bg-transparent md:p-0">
            <div className="text-lg font-semibold leading-tight tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="inline-flex self-start rounded-lg border bg-muted p-1 md:self-auto" role="tablist">
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            role="tab"
            aria-selected={viewMode === value}
            onClick={() => onViewModeChange(value)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
