import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/** A financing round for a portfolio company. Money in CENTS, price per share in CENTS. */
export interface PortcoRound {
  id: string;
  portfolio_company_id: string;
  round_name: string;
  round_type: string | null;
  close_date: string | null;
  pre_money_valuation: number | null;
  post_money_valuation: number | null;
  price_per_share: number | null;
  amount_raised: number | null;
  lead_investor: string | null;
  we_participated: boolean;
  our_amount: number | null;
  our_shares: number | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RoundValues = Omit<
  PortcoRound,
  'id' | 'portfolio_company_id' | 'created_at' | 'updated_at'
>;

export const ROUND_TYPES = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
  'Bridge',
  'Convertible / SAFE',
  'Growth',
  'Secondary',
  'Other',
];

const COLUMNS =
  'id, portfolio_company_id, round_name, round_type, close_date, pre_money_valuation, post_money_valuation, price_per_share, amount_raised, lead_investor, we_participated, our_amount, our_shares, source, notes, created_at, updated_at';

async function fetchRounds(companyId?: string): Promise<PortcoRound[]> {
  let query = supabase.from('portco_funding_rounds').select(COLUMNS);
  if (companyId) query = query.eq('portfolio_company_id', companyId);
  const { data, error } = await query.order('close_date', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PortcoRound[];
}

/** Rounds for one company, with create / update / delete. */
export function usePortcoRounds(companyId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const key = useMemo(() => ['portcoRounds', companyId], [companyId]);

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchRounds(companyId as string),
    enabled: !!companyId && !!user?.id,
  });

  useEffect(() => {
    if (!companyId || !user?.id) return;
    const channel = supabase.channel(`portco_rounds_${companyId}_${Math.random().toString(36).slice(2)}`);
    channelRef.current = channel;
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portco_funding_rounds',
          filter: `portfolio_company_id=eq.${companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: key });
          queryClient.invalidateQueries({ queryKey: ['allPortcoRounds'] });
        },
      )
      .subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [companyId, user?.id, queryClient, key]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: key });
    await queryClient.invalidateQueries({ queryKey: ['allPortcoRounds'] });
  };

  const saveRound = async (values: RoundValues, id?: string) => {
    if (!companyId || !user?.id) return false;
    setSaving(true);
    try {
      const payload = { ...values, portfolio_company_id: companyId, created_by: user.id };
      const { error } = id
        ? await supabase.from('portco_funding_rounds').update(payload).eq('id', id)
        : await supabase.from('portco_funding_rounds').insert(payload);
      if (error) throw error;
      await invalidate();
      return true;
    } catch (e) {
      toast({ title: 'Could not save round', description: (e as Error).message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteRound = async (id: string) => {
    const { error } = await supabase.from('portco_funding_rounds').delete().eq('id', id);
    if (error) {
      toast({ title: 'Could not delete round', description: error.message, variant: 'destructive' });
      return false;
    }
    await invalidate();
    return true;
  };

  return { rounds, loading: isLoading, saving, saveRound, deleteRound };
}

/** Every round across the portfolio, grouped by company, for cross-portfolio step-up views. */
export function useAllPortcoRounds() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data: rounds = [], isLoading } = useQuery({
    queryKey: ['allPortcoRounds'],
    queryFn: () => fetchRounds(),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`all_portco_rounds_${Math.random().toString(36).slice(2)}`);
    channelRef.current = channel;
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portco_funding_rounds' }, () =>
        queryClient.invalidateQueries({ queryKey: ['allPortcoRounds'] }),
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
    const map = new Map<string, PortcoRound[]>();
    for (const r of rounds) {
      const list = map.get(r.portfolio_company_id);
      if (list) list.push(r);
      else map.set(r.portfolio_company_id, [r]);
    }
    return map;
  }, [rounds]);

  return { rounds, byCompany, loading: isLoading };
}
