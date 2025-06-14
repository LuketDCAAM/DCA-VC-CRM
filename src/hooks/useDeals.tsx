
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';

async function fetchDeals(userId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export function useDeals() {
  const { user } = useAuth();

  const {
    data: deals = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return fetchDeals(user.id);
    },
    enabled: !!user?.id,
  });

  return {
    deals,
    loading,
    refetch,
  };
}
