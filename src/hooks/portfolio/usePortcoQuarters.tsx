import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { comparePeriods, computeStatus, deriveQuarter, type PerformanceStatus } from '@/lib/portfolio/metrics';
import type { KpiUnit } from '@/lib/portfolio/kpiFields';

export interface PortcoQuarter {
  id: string;
  portfolio_company_id: string;
  fiscal_year: number;
  fiscal_quarter: number;
  revenue: number | null;
  arr: number | null;
  gross_margin: number | null;
  gross_burn: number | null;
  net_burn: number | null;
  cash_balance: number | null;
  headcount: number | null;
  nrr: number | null;
  grr: number | null;
  monthly_churn: number | null;
  customer_count: number | null;
  custom_metrics: Record<string, number | null>;
  targets: Record<string, number | null>;
  computed: Record<string, number | null>;
  performance_status: string | null;
  status_override: string | null;
  status_reason: string | null;
  ai_commentary: string | null;
  commentary_updated_at: string | null;
  notes: string | null;
  updated_at: string;
  /** Valuation mark for the quarter (money in cents, ownership as a decimal). */
  mark_date: string | null;
  company_valuation: number | null;
  ownership_pct: number | null;
  our_fmv: number | null;
  mark_method: string | null;
}

export interface CustomKpiDefinition {
  id: string;
  portfolio_company_id: string;
  key: string;
  label: string;
  unit: KpiUnit;
  higher_is_better: boolean;
  sort_order: number;
}

const QUARTER_COLUMNS =
  'id, portfolio_company_id, fiscal_year, fiscal_quarter, revenue, arr, gross_margin, gross_burn, net_burn, cash_balance, headcount, nrr, grr, monthly_churn, customer_count, custom_metrics, targets, computed, performance_status, status_override, status_reason, ai_commentary, commentary_updated_at, notes, updated_at, mark_date, company_valuation, ownership_pct, our_fmv, mark_method';

export type QuarterValues = Partial<
  Pick<
    PortcoQuarter,
    | 'revenue'
    | 'arr'
    | 'gross_margin'
    | 'gross_burn'
    | 'net_burn'
    | 'cash_balance'
    | 'headcount'
    | 'nrr'
    | 'grr'
    | 'monthly_churn'
    | 'customer_count'
    | 'custom_metrics'
    | 'targets'
    | 'status_override'
    | 'status_reason'
    | 'notes'
    | 'ai_commentary'
    | 'mark_date'
    | 'company_valuation'
    | 'ownership_pct'
    | 'our_fmv'
    | 'mark_method'
  >
>;


/** Recompute derived values + auto status for a quarter given its siblings. */
export function buildComputed(quarters: PortcoQuarter[], target: PortcoQuarter) {
  const sorted = [...quarters].sort(comparePeriods);
  const idx = sorted.findIndex(
    (q) => q.fiscal_year === target.fiscal_year && q.fiscal_quarter === target.fiscal_quarter,
  );
  const prior = idx > 0 ? sorted[idx - 1] : undefined;
  const yearAgo = sorted.find(
    (q) => q.fiscal_year === target.fiscal_year - 1 && q.fiscal_quarter === target.fiscal_quarter,
  );
  const derived = deriveQuarter(target, prior, yearAgo);
  const status = computeStatus(derived);
  return { derived, status };
}

export function resolveStatus(q: PortcoQuarter): PerformanceStatus {
  const value = (q.status_override || q.performance_status) as PerformanceStatus | null;
  return value ?? 'Unknown';
}

async function fetchQuarters(companyId: string): Promise<PortcoQuarter[]> {
  const { data, error } = await supabase
    .from('portco_quarterly_metrics')
    .select(QUARTER_COLUMNS)
    .eq('portfolio_company_id', companyId)
    .order('fiscal_year', { ascending: true })
    .order('fiscal_quarter', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PortcoQuarter[];
}

async function fetchDefinitions(companyId: string): Promise<CustomKpiDefinition[]> {
  const { data, error } = await supabase
    .from('portco_kpi_definitions')
    .select('id, portfolio_company_id, key, label, unit, higher_is_better, sort_order')
    .eq('portfolio_company_id', companyId)
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CustomKpiDefinition[];
}

export function usePortcoQuarters(companyId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const quartersKey = useMemo(() => ['portcoQuarters', companyId], [companyId]);
  const defsKey = useMemo(() => ['portcoKpiDefs', companyId], [companyId]);

  const { data: quarters = [], isLoading } = useQuery({
    queryKey: quartersKey,
    queryFn: () => fetchQuarters(companyId as string),
    enabled: !!companyId && !!user?.id,
  });

  const { data: definitions = [] } = useQuery({
    queryKey: defsKey,
    queryFn: () => fetchDefinitions(companyId as string),
    enabled: !!companyId && !!user?.id,
  });

  useEffect(() => {
    if (!companyId || !user?.id) return;
    const channel = supabase.channel(`portco_quarters_${companyId}_${Math.random().toString(36).slice(2)}`);
    channelRef.current = channel;
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portco_quarterly_metrics', filter: `portfolio_company_id=eq.${companyId}` },
        () => queryClient.invalidateQueries({ queryKey: quartersKey }),
      )
      .subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [companyId, user?.id, queryClient, quartersKey]);

  const saveQuarter = async (year: number, quarter: number, values: QuarterValues) => {
    if (!companyId) return false;
    setSaving(true);
    try {
      const existing = quarters.find((q) => q.fiscal_year === year && q.fiscal_quarter === quarter);
      const merged = {
        ...(existing ?? {
          id: 'draft',
          portfolio_company_id: companyId,
          fiscal_year: year,
          fiscal_quarter: quarter,
          custom_metrics: {},
          targets: {},
          computed: {},
        }),
        ...values,
      } as PortcoQuarter;

      const others = quarters.filter((q) => !(q.fiscal_year === year && q.fiscal_quarter === quarter));
      const { derived, status } = buildComputed([...others, merged], merged);

      const payload = {
        portfolio_company_id: companyId,
        fiscal_year: year,
        fiscal_quarter: quarter,
        revenue: merged.revenue ?? null,
        arr: merged.arr ?? null,
        gross_margin: merged.gross_margin ?? null,
        gross_burn: merged.gross_burn ?? null,
        net_burn: merged.net_burn ?? null,
        cash_balance: merged.cash_balance ?? null,
        headcount: merged.headcount ?? null,
        nrr: merged.nrr ?? null,
        grr: merged.grr ?? null,
        monthly_churn: merged.monthly_churn ?? null,
        customer_count: merged.customer_count ?? null,
        custom_metrics: merged.custom_metrics ?? {},
        targets: merged.targets ?? {},
        computed: { ...derived, status_reasons: status.reasons } as unknown as Record<string, unknown>,
        performance_status: status.status,
        status_override: merged.status_override ?? null,
        status_reason: merged.status_reason ?? null,
        notes: merged.notes ?? null,
        mark_date: merged.mark_date ?? null,
        company_valuation: merged.company_valuation ?? null,
        ownership_pct: merged.ownership_pct ?? null,
        our_fmv:
          merged.our_fmv ??
          (merged.company_valuation != null && merged.ownership_pct != null
            ? Math.round(merged.company_valuation * merged.ownership_pct)
            : null),
        mark_method: merged.mark_method ?? null,
        ...(values.ai_commentary !== undefined
          ? { ai_commentary: values.ai_commentary, commentary_updated_at: new Date().toISOString() }
          : {}),
      };


      const { error } = await supabase
        .from('portco_quarterly_metrics')
        .upsert([payload] as never, { onConflict: 'portfolio_company_id,fiscal_year,fiscal_quarter' });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: quartersKey });
      return true;
    } catch (e) {
      toast({ title: 'Could not save quarter', description: (e as Error).message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteQuarter = async (id: string) => {
    const { error } = await supabase.from('portco_quarterly_metrics').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete quarter', description: error.message, variant: 'destructive' });
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: quartersKey });
    return true;
  };

  const addDefinition = async (input: { label: string; unit: KpiUnit; higher_is_better: boolean }) => {
    if (!companyId) return false;
    const key = input.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    if (!key) {
      toast({ title: 'Give the KPI a name', variant: 'destructive' });
      return false;
    }
    const { error } = await supabase.from('portco_kpi_definitions').insert({
      portfolio_company_id: companyId,
      key,
      label: input.label,
      unit: input.unit,
      higher_is_better: input.higher_is_better,
      sort_order: definitions.length,
    });
    if (error) {
      toast({ title: 'Could not add KPI', description: error.message, variant: 'destructive' });
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: defsKey });
    return true;
  };

  const removeDefinition = async (id: string) => {
    const { error } = await supabase.from('portco_kpi_definitions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not remove KPI', description: error.message, variant: 'destructive' });
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: defsKey });
    return true;
  };

  const latest = useMemo(() => {
    if (!quarters.length) return null;
    return [...quarters].sort(comparePeriods)[quarters.length - 1];
  }, [quarters]);

  return {
    quarters,
    definitions,
    latest,
    loading: isLoading,
    saving,
    saveQuarter,
    deleteQuarter,
    addDefinition,
    removeDefinition,
  };
}
