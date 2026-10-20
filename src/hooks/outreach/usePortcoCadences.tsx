import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { cadenceBucket, computeNextDue, formatDateOnly, type CadenceBucket } from '@/lib/outreach/constants';

export type PortcoCadence = Database['public']['Tables']['portco_cadences']['Row'];
export type PortcoCadenceView = PortcoCadence & { next_due: string | null; bucket: CadenceBucket };

export function usePortcoCadences() {
  const [cadences, setCadences] = useState<PortcoCadence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCadences = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('portco_cadences').select('*');
      if (error) throw error;
      setCadences(data || []);
    } catch (error: any) {
      toast({ title: 'Could not load check-in rhythms', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCadences();
  }, [fetchCadences]);

  const views = useMemo<PortcoCadenceView[]>(
    () =>
      cadences.map((c) => {
        const next = computeNextDue(c);
        return { ...c, next_due: next ? formatDateOnly(next) : null, bucket: cadenceBucket(c) };
      }),
    [cadences],
  );

  const byCompany = useMemo(() => new Map(views.map((v) => [v.portfolio_company_id, v])), [views]);

  const saveCadence = async (companyId: string, updates: Partial<PortcoCadence>, silent = false) => {
    if (!user) return null;
    try {
      const existing = cadences.find((c) => c.portfolio_company_id === companyId);
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = updates as PortcoCadence;
      const { data, error } = await supabase
        .from('portco_cadences')
        .upsert(
          { ...rest, portfolio_company_id: companyId, created_by: existing?.created_by ?? user.id },
          { onConflict: 'portfolio_company_id' },
        )
        .select()
        .single();
      if (error) throw error;
      setCadences((prev) => [...prev.filter((c) => c.portfolio_company_id !== companyId), data]);
      if (!silent) toast({ title: 'Check-in rhythm saved' });
      return data;
    } catch (error: any) {
      toast({ title: 'Could not save rhythm', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const clearCadence = async (companyId: string) => {
    try {
      const { error } = await supabase.from('portco_cadences').delete().eq('portfolio_company_id', companyId);
      if (error) throw error;
      setCadences((prev) => prev.filter((c) => c.portfolio_company_id !== companyId));
      toast({ title: 'Rhythm removed' });
    } catch (error: any) {
      toast({ title: 'Could not remove rhythm', description: error.message, variant: 'destructive' });
    }
  };

  /** Record that we reached out today (or on `date`). */
  const markContacted = async (companyId: string, date = formatDateOnly(new Date())) => {
    if (!byCompany.has(companyId)) return;
    await saveCadence(companyId, { last_contacted_at: date }, true);
  };

  return { cadences, views, byCompany, loading, saveCadence, clearCadence, markContacted, refetch: fetchCadences };
}
