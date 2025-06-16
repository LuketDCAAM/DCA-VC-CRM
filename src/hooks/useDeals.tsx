
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useEffect, useMemo, useId, useRef } from 'react';

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

// Define pipeline stages that represent truly active deals (beyond early screening)
export const ACTIVE_PIPELINE_STAGES = [
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Term Sheet',
  'Legal Review'
];

// Define early screening stages that are not considered active pipeline
export const SCREENING_STAGES = [
  'Seen Not Reviewed',
  'Initial Review'
];

// Define final outcome stages
export const FINAL_STAGES = {
  INVESTED: 'Invested',
  PASSED: 'Passed'
};

export function useDeals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const id = useId(); // Create a unique ID for this hook instance
  const channelRef = useRef<any>(null);

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

  // Calculate deal statistics with proper pipeline stage filtering
  const dealStats = useMemo(() => {
    const totalDeals = deals.length;
    
    // Active deals: Only include deals in truly active pipeline stages
    const activeDeals = deals.filter(deal => 
      ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage)
    ).length;
    
    // Invested deals: Only deals marked as invested
    const investedDeals = deals.filter(deal => 
      deal.pipeline_stage === FINAL_STAGES.INVESTED
    ).length;
    
    // Passed deals: Only deals marked as passed
    const passedDeals = deals.filter(deal => 
      deal.pipeline_stage === FINAL_STAGES.PASSED
    ).length;

    // Screening deals: Deals in early screening stages
    const screeningDeals = deals.filter(deal => 
      SCREENING_STAGES.includes(deal.pipeline_stage)
    ).length;

    console.log('Deal Statistics Breakdown:', {
      totalDeals,
      activeDeals,
      investedDeals,
      passedDeals,
      screeningDeals,
      activePipelineStages: ACTIVE_PIPELINE_STAGES,
      screeningStages: SCREENING_STAGES
    });

    return {
      totalDeals,
      activeDeals,
      investedDeals,
      passedDeals,
      screeningDeals
    };
  }, [deals]);

  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

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

    channelRef.current = dealsChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient, queryKey, id]);

  return {
    deals,
    loading,
    refetch,
    dealStats,
  };
}
