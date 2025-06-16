
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useMemo } from 'react';
import { fetchDeals } from './deals/fetchDeals';
import { calculateDealStats, DealStats } from './deals/dealStatsCalculator';
import { useDealsSubscription } from './deals/useDealsSubscription';

// Re-export stage configurations for backward compatibility
export { ACTIVE_PIPELINE_STAGES, SCREENING_STAGES, FINAL_STAGES } from './deals/dealStagesConfig';

export function useDeals() {
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
  });

  // Enhanced deal statistics calculation with detailed logging
  const dealStats: DealStats = useMemo(() => {
    return calculateDealStats(deals);
  }, [deals]);

  // Enhanced subscription with better error handling and logging
  useDealsSubscription(user?.id, queryKey);

  return {
    deals,
    loading,
    refetch,
    dealStats,
  };
}
