import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Distinct, non-empty values of the deals.sourced_by column straight from the
 * database, so the "Sourced By" filter lists exactly what is stored there.
 */
export function useSourcedByValues() {
  const { data = [] } = useQuery({
    queryKey: ['deals', 'sourced_by_values'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('sourced_by')
        .not('sourced_by', 'is', null)
        .limit(20000);

      if (error) throw new Error(error.message);

      const set = new Set<string>();
      (data ?? []).forEach((row: { sourced_by: string | null }) => {
        const value = row.sourced_by?.trim();
        if (value) set.add(value);
      });

      return Array.from(set)
        .sort((a, b) => a.localeCompare(b))
        .map(value => ({ label: value, value }));
    },
    staleTime: 300000,
  });

  return data;
}
