import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { cadenceBucket, computeNextDue, formatDateOnly, isDueInMonth, type CadenceBucket } from '@/lib/outreach/constants';

export type InvestorCadence = Database['public']['Tables']['investor_cadences']['Row'];

export interface CadenceView extends InvestorCadence {
  next_due: string | null;
  bucket: CadenceBucket;
}

export function useInvestorCadences() {
  const [cadences, setCadences] = useState<InvestorCadence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCadences = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('investor_cadences').select('*');
      if (error) throw error;
      setCadences(data || []);
    } catch (error: any) {
      toast({ title: 'Could not load cadences', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCadences();
  }, [fetchCadences]);

  const views = useMemo<CadenceView[]>(
    () =>
      cadences.map((c) => {
        const next = computeNextDue(c);
        return { ...c, next_due: next ? formatDateOnly(next) : null, bucket: cadenceBucket(c) };
      }),
    [cadences],
  );

  const byInvestor = useMemo(() => {
    const map = new Map<string, CadenceView>();
    views.forEach((v) => map.set(v.investor_id, v));
    return map;
  }, [views]);

  const saveCadence = async (
    investorId: string,
    updates: Partial<Pick<InvestorCadence, 'interval_key' | 'anchor_rule' | 'anchor_day' | 'paused' | 'resume_on' | 'last_contacted_at' | 'owner_id' | 'notes'>>,
  ) => {
    if (!user) return null;
    try {
      const existing = cadences.find((c) => c.investor_id === investorId);
      const payload = {
        investor_id: investorId,
        created_by: existing?.created_by ?? user.id,
        ...updates,
      };
      const { data, error } = await supabase
        .from('investor_cadences')
        .upsert(payload, { onConflict: 'investor_id' })
        .select()
        .single();
      if (error) throw error;
      setCadences((prev) => {
        const rest = prev.filter((c) => c.investor_id !== investorId);
        return [...rest, data];
      });
      toast({ title: 'Cadence saved' });
      return data;
    } catch (error: any) {
      toast({ title: 'Could not save cadence', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const clearCadence = async (investorId: string) => {
    try {
      const { error } = await supabase.from('investor_cadences').delete().eq('investor_id', investorId);
      if (error) throw error;
      setCadences((prev) => prev.filter((c) => c.investor_id !== investorId));
      toast({ title: 'Cadence removed' });
    } catch (error: any) {
      toast({ title: 'Could not remove cadence', description: error.message, variant: 'destructive' });
    }
  };

  /** Investor ids that should be contacted in the given month. */
  const dueInMonth = useCallback(
    (month: Date) => cadences.filter((c) => isDueInMonth(c, month)).map((c) => c.investor_id),
    [cadences],
  );

  return { cadences, views, byInvestor, loading, saveCadence, clearCadence, dueInMonth, refetch: fetchCadences };
}
