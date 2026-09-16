import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type OutreachBatch = Database['public']['Tables']['outreach_batches']['Row'];
export type OutreachBatchItem = Database['public']['Tables']['outreach_batch_items']['Row'];

export interface NewBatchItem {
  investor_id: string;
  owner_id: string;
  deal_ids: string[];
  match_rationale?: Record<string, string>;
}

export function useOutreachBatches() {
  const [batches, setBatches] = useState<OutreachBatch[]>([]);
  const [items, setItems] = useState<OutreachBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    if (!user) {
      setBatches([]);
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [batchRes, itemRes] = await Promise.all([
        supabase.from('outreach_batches').select('*').order('period_month', { ascending: false }),
        supabase.from('outreach_batch_items').select('*').order('created_at', { ascending: true }),
      ]);
      if (batchRes.error) throw batchRes.error;
      if (itemRes.error) throw itemRes.error;
      setBatches(batchRes.data || []);
      setItems(itemRes.data || []);
    } catch (error: any) {
      toast({ title: 'Could not load investor digests', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createBatch = async (periodMonth: string, title: string, newItems: NewBatchItem[], introNote?: string) => {
    if (!user) return null;
    try {
      const { data: batch, error } = await supabase
        .from('outreach_batches')
        .insert({ period_month: periodMonth, title, intro_note: introNote || null, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      if (newItems.length) {
        const { data: inserted, error: itemError } = await supabase
          .from('outreach_batch_items')
          .insert(
            newItems.map((i) => ({
              batch_id: batch.id,
              investor_id: i.investor_id,
              owner_id: i.owner_id,
              created_by: user.id,
              deal_ids: i.deal_ids,
              match_rationale: i.match_rationale ?? {},
            })),
          )
          .select();
        if (itemError) throw itemError;
        setItems((prev) => [...prev, ...(inserted || [])]);
      }

      setBatches((prev) => [batch, ...prev]);
      toast({ title: 'Digest created', description: `${newItems.length} investor${newItems.length === 1 ? '' : 's'} queued.` });
      return batch;
    } catch (error: any) {
      toast({ title: 'Could not create the digest', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<OutreachBatchItem>, silent = false) => {
    try {
      const { data, error } = await supabase
        .from('outreach_batch_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      if (!silent) toast({ title: 'Updated' });
      return data;
    } catch (error: any) {
      toast({ title: 'Could not update', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('outreach_batch_items').delete().eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (error: any) {
      toast({ title: 'Could not remove investor', description: error.message, variant: 'destructive' });
    }
  };

  const deleteBatch = async (id: string) => {
    try {
      const { error } = await supabase.from('outreach_batches').delete().eq('id', id);
      if (error) throw error;
      setBatches((prev) => prev.filter((b) => b.id !== id));
      setItems((prev) => prev.filter((i) => i.batch_id !== id));
      toast({ title: 'Digest deleted' });
    } catch (error: any) {
      toast({ title: 'Could not delete the digest', description: error.message, variant: 'destructive' });
    }
  };

  return { batches, items, loading, createBatch, updateItem, deleteItem, deleteBatch, refetch: fetchAll };
}
