
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useEffect, useMemo, useId } from 'react';

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
  const queryClient = useQueryClient();
  const id = useId(); // Create a unique ID for this hook instance

  const queryKey = useMemo(() => ['deals', user?.id], [user?.id]);

  const {
    data: deals = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!user?.id) return [];
      return fetchDeals(user.id);
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channelName = `custom-deals-channel-${id}`;
    const dealsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `created_by=eq.${user.id}`,
        },
        (payload) => {
          console.log('Deals change received!', payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dealsChannel);
    };
  }, [user?.id, queryClient, queryKey, id]);

  return {
    deals,
    loading,
    refetch,
  };
}
