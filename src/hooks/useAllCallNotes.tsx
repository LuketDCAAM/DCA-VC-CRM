import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type CallNote = Database['public']['Tables']['call_notes']['Row'];

async function fetchAllCallNotes(): Promise<CallNote[]> {
  const { data, error } = await supabase
    .from('call_notes')
    .select('*')
    .order('call_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export function useAllCallNotes() {
  const { data: callNotes = [], isLoading } = useQuery({
    queryKey: ['all_call_notes'],
    queryFn: fetchAllCallNotes,
  });

  return {
    callNotes,
    isLoading,
  };
}