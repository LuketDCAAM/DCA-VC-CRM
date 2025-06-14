
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

export type CallNote = Database['public']['Tables']['call_notes']['Row'];
export type NewCallNote = Omit<Database['public']['Tables']['call_notes']['Insert'], 'call_date'> & { call_date: string };
export type UpdatedCallNote = Omit<Database['public']['Tables']['call_notes']['Update'], 'call_date'> & { call_date?: string };


async function fetchCallNotes(dealId: string): Promise<CallNote[]> {
  const { data, error } = await supabase
    .from('call_notes')
    .select('*')
    .eq('deal_id', dealId)
    .order('call_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

async function addCallNote(note: NewCallNote): Promise<CallNote | null> {
  const { data, error } = await supabase
    .from('call_notes')
    .insert(note)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function updateCallNote({ id, ...updates }: UpdatedCallNote & { id: string }): Promise<CallNote | null> {
    const { data, error } = await supabase
        .from('call_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

async function deleteCallNote(id: string): Promise<void> {
    const { error } = await supabase
        .from('call_notes')
        .delete()
        .eq('id', id);
    
    if (error) throw new Error(error.message);
}

export function useCallNotes(dealId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['call_notes', dealId];

  const { data: callNotes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchCallNotes(dealId),
    enabled: !!dealId,
  });

  const addNoteMutation = useMutation({
    mutationFn: addCallNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: updateCallNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteCallNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    callNotes,
    isLoading,
    addCallNote: addNoteMutation.mutateAsync,
    updateCallNote: updateNoteMutation.mutateAsync,
    deleteCallNote: deleteNoteMutation.mutateAsync,
  };
}
