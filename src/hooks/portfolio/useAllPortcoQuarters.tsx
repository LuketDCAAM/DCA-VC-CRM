import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { comparePeriods, periodIndex, periodLabel } from '@/lib/portfolio/metrics';
import type { PortcoQuarter } from '@/hooks/portfolio/usePortcoQuarters';

const COLUMNS =
  'id, portfolio_company_id, fiscal_year, fiscal_quarter, revenue, arr, gross_margin, gross_burn, net_burn, cash_balance, headcount, nrr, grr, monthly_churn, customer_count, custom_metrics, targets, computed, performance_status, status_override, status_reason, ai_commentary, commentary_updated_at, notes, updated_at, mark_date, company_valuation, ownership_pct, our_fmv, mark_method';

async function fetchAllQuarters(): Promise<PortcoQuarter[]> {
  const { data, error } = await supabase
    .from('portco_quarterly_metrics')
    .select(COLUMNS)
    .order('fiscal_year', { ascending: true })
    .order('fiscal_quarter', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PortcoQuarter[];
}

export interface PeriodOption {
  key: string;
  label: string;
  fiscal_year: number;
  fiscal_quarter: number;
}

/** All quarterly rows across every portfolio company, grouped for comparison views. */
export function useAllPortcoQuarters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: quarters = [], isLoading } = useQuery({
    queryKey: ['allPortcoQuarters'],
    queryFn: fetchAllQuarters,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`all_portco_quarters_${Math.random().toString(36).slice(2)}`);
    channelRef.current = channel;
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portco_quarterly_metrics' }, () =>
        queryClient.invalidateQueries({ queryKey: ['allPortcoQuarters'] }),
      )
      .subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient]);

  const byCompany = useMemo(() => {
    const map = new Map<string, PortcoQuarter[]>();
    for (const q of quarters) {
      const list = map.get(q.portfolio_company_id);
      if (list) list.push(q);
      else map.set(q.portfolio_company_id, [q]);
    }
    map.forEach((list) => list.sort(comparePeriods));
    return map;
  }, [quarters]);

  const periods = useMemo<PeriodOption[]>(() => {
    const seen = new Map<number, PeriodOption>();
    for (const q of quarters) {
      const idx = periodIndex(q.fiscal_year, q.fiscal_quarter);
      if (!seen.has(idx)) {
        seen.set(idx, {
          key: periodLabel(q.fiscal_year, q.fiscal_quarter),
          label: periodLabel(q.fiscal_year, q.fiscal_quarter),
          fiscal_year: q.fiscal_year,
          fiscal_quarter: q.fiscal_quarter,
        });
      }
    }
    return Array.from(seen.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, v]) => v);
  }, [quarters]);

  return { quarters, byCompany, periods, loading: isLoading };
}
