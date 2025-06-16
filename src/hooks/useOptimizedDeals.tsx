
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useMemo, useCallback } from 'react';
import { fetchDeals } from './deals/fetchDeals';
import { useOptimizedDealStats } from './deals/useOptimizedDealStats';
import { useDealsSubscription } from './deals/useDealsSubscription';

export function useOptimizedDeals() {
  const { user } = useAuth();

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
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Memoized deal stats calculation
  const dealStats = useOptimizedDealStats(deals);

  // Memoized refetch function to prevent unnecessary re-renders
  const memoizedRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  // Enhanced subscription with better error handling and logging
  useDealsSubscription(user?.id, queryKey);

  return {
    deals,
    loading,
    refetch: memoizedRefetch,
    dealStats,
  };
}
