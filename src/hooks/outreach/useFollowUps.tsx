import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type FollowUp = Database['public']['Tables']['outreach_follow_ups']['Row'];
export type FollowUpInsert = Database['public']['Tables']['outreach_follow_ups']['Insert'];

export interface NewFollowUp {
  deal_id?: string | null;
  investor_id?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  purpose: string;
  due_date: string;
  owner_id: string;
  context?: string | null;
}

export function useFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFollowUps = useCallback(async () => {
    if (!user) {
      setFollowUps([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('outreach_follow_ups')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      setFollowUps(data || []);
    } catch (error: any) {
      toast({ title: 'Could not load follow-ups', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Realtime: keep the queue live for whoever owns the items.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`outreach-follow-ups-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_follow_ups' }, () => {
        fetchFollowUps();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFollowUps]);

  const createFollowUp = async (input: NewFollowUp) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('outreach_follow_ups')
        .insert({
          ...input,
          deal_id: input.deal_id || null,
          investor_id: input.investor_id || null,
          contact_name: input.contact_name || null,
          contact_email: input.contact_email || null,
          context: input.context || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      setFollowUps((prev) => [...prev, data]);
      toast({ title: 'Follow-up scheduled', description: `Due ${input.due_date}.` });
      return data;
    } catch (error: any) {
      toast({ title: 'Could not schedule follow-up', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateFollowUp = async (id: string, updates: Partial<FollowUp>, silent = false) => {
    try {
      const { data, error } = await supabase
        .from('outreach_follow_ups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setFollowUps((prev) => prev.map((f) => (f.id === id ? data : f)));
      if (!silent) toast({ title: 'Follow-up updated' });
      return data;
    } catch (error: any) {
      toast({ title: 'Could not update follow-up', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteFollowUp = async (id: string) => {
    try {
      const { error } = await supabase.from('outreach_follow_ups').delete().eq('id', id);
      if (error) throw error;
      setFollowUps((prev) => prev.filter((f) => f.id !== id));
      toast({ title: 'Follow-up removed' });
    } catch (error: any) {
      toast({ title: 'Could not remove follow-up', description: error.message, variant: 'destructive' });
    }
  };

  return { followUps, loading, createFollowUp, updateFollowUp, deleteFollowUp, refetch: fetchFollowUps };
}
