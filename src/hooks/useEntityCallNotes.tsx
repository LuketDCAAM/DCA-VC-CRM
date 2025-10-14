import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CallNote {
  id: string;
  title: string;
  content: string | null;
  call_date: string;
  deal_id: string | null;
  investor_id: string | null;
  portfolio_company_id: string | null;
  created_by: string;
  created_at: string;
}

export interface NewCallNote {
  title: string;
  content?: string | null;
  call_date: string;
  deal_id?: string | null;
  investor_id?: string | null;
  portfolio_company_id?: string | null;
}

export interface UpdatedCallNote {
  id: string;
  title?: string;
  content?: string | null;
  call_date?: string;
}

type EntityType = 'deal' | 'investor' | 'portfolio_company';

interface EntityCallNotesParams {
  entityId: string;
  entityType: EntityType;
}

async function fetchEntityCallNotes(entityId: string, entityType: EntityType): Promise<CallNote[]> {
  let query = supabase
    .from('call_notes')
    .select('*');

  if (entityType === 'deal') {
    query = query.eq('deal_id', entityId);
  } else if (entityType === 'investor') {
    query = query.eq('investor_id', entityId);
  } else {
    query = query.eq('portfolio_company_id', entityId);
  }

  const { data, error } = await query.order('call_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as CallNote[]) || [];
}

async function addCallNote(note: NewCallNote): Promise<CallNote | null> {
  const { data, error } = await supabase
    .from('call_notes')
    .insert(note as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CallNote;
}

async function updateCallNote({ id, ...updates }: UpdatedCallNote): Promise<CallNote | null> {
  const { data, error } = await supabase
    .from('call_notes')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CallNote;
}

async function deleteCallNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('call_notes')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(error.message);
}

export function useEntityCallNotes({ entityId, entityType }: EntityCallNotesParams) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['call_notes', entityType, entityId];

  const { data: callNotes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchEntityCallNotes(entityId, entityType),
    enabled: !!entityId,
  });

  const addNoteMutation = useMutation({
    mutationFn: addCallNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Call note added',
        description: 'Your call note has been saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding call note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: updateCallNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Call note updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating call note',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteCallNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: 'Call note deleted',
        description: 'The call note has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting call note',
        description: error.message,
        variant: 'destructive',
      });
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
