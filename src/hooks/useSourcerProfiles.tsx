import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SourcerProfile {
  id: string;
  name: string | null;
  email: string | null;
  is_active?: boolean;
}

/**
 * Active staff profiles for the "Sourced By" dropdown.
 * When `currentId` points at an inactive (former employee) profile it is unioned in
 * so historical deals don't render a blank field.
 */
export function useSourcerProfiles(currentId?: string | null) {
  const activeQuery = useQuery({
    queryKey: ['sourcer-profiles', 'active'],
    queryFn: async (): Promise<SourcerProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentQuery = useQuery({
    queryKey: ['sourcer-profiles', 'current', currentId],
    enabled: !!currentId,
    queryFn: async (): Promise<SourcerProfile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, is_active')
        .eq('id', currentId as string)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const options = activeQuery.data ?? [];
  const current = currentQuery.data;

  const selectable: SourcerProfile[] =
    current && !options.some(o => o.id === current.id)
      ? [...options, { ...current, name: `${current.name ?? current.email ?? 'Unknown'} (former)` }]
      : options;

  return {
    profiles: selectable,
    loading: activeQuery.isLoading,
  };
}
