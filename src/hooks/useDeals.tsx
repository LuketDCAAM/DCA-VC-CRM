
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useEffect, useMemo, useId, useRef } from 'react';

async function fetchDeals(userId: string): Promise<Deal[]> {
  console.log('Fetching deals for user:', userId);
  
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
    throw new Error(error.message);
  }
  
  console.log('Raw deals data from database:', data?.length || 0, 'deals');
  console.log('Pipeline stage distribution:', data?.reduce((acc, deal) => {
    acc[deal.pipeline_stage] = (acc[deal.pipeline_stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));
  
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
  const id = useId();
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

  // Enhanced deal statistics calculation with detailed logging
  const dealStats = useMemo(() => {
    console.log('=== DEAL STATISTICS CALCULATION ===');
    console.log('Total deals in array:', deals.length);
    
    const totalDeals = deals.length;
    
    // Count deals by category with detailed logging
    const activeDealsList = deals.filter(deal => 
      ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage)
    );
    console.log('Active deals:', activeDealsList.length, 'deals in stages:', ACTIVE_PIPELINE_STAGES);
    console.log('Active deals list:', activeDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));
    
    const investedDealsList = deals.filter(deal => 
      deal.pipeline_stage === FINAL_STAGES.INVESTED
    );
    console.log('Invested deals:', investedDealsList.length, 'deals');
    console.log('Invested deals list:', investedDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));
    
    const passedDealsList = deals.filter(deal => 
      deal.pipeline_stage === FINAL_STAGES.PASSED
    );
    console.log('Passed deals:', passedDealsList.length, 'deals');
    console.log('Passed deals list:', passedDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));

    const screeningDealsList = deals.filter(deal => 
      SCREENING_STAGES.includes(deal.pipeline_stage)
    );
    console.log('Screening deals:', screeningDealsList.length, 'deals in stages:', SCREENING_STAGES);
    console.log('Screening deals list:', screeningDealsList.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));

    // Verify our counts add up correctly
    const categorizedCount = activeDealsList.length + investedDealsList.length + passedDealsList.length + screeningDealsList.length;
    console.log('Total categorized deals:', categorizedCount, 'vs total deals:', totalDeals);
    
    if (categorizedCount !== totalDeals) {
      const uncategorized = deals.filter(deal => 
        !ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage) &&
        deal.pipeline_stage !== FINAL_STAGES.INVESTED &&
        deal.pipeline_stage !== FINAL_STAGES.PASSED &&
        !SCREENING_STAGES.includes(deal.pipeline_stage)
      );
      console.warn('UNCATEGORIZED DEALS FOUND:', uncategorized.length);
      console.warn('Uncategorized deals:', uncategorized.map(d => ({ name: d.company_name, stage: d.pipeline_stage })));
    }

    const finalStats = {
      totalDeals,
      activeDeals: activeDealsList.length,
      investedDeals: investedDealsList.length,
      passedDeals: passedDealsList.length,
      screeningDeals: screeningDealsList.length
    };

    console.log('=== FINAL DEAL STATISTICS ===', finalStats);
    console.log('=====================================');

    return finalStats;
  }, [deals]);

  // Enhanced subscription with better error handling and logging
  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing channel
    if (channelRef.current) {
      console.log('Cleaning up existing deals channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `deals-channel-${id}`;
    console.log('Setting up deals subscription:', channelName);
    
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
          console.log('=== DEALS REALTIME UPDATE ===');
          console.log('Event:', payload.eventType);
          console.log('Table:', payload.table);
          console.log('Payload:', payload);
          console.log('Invalidating deals query...');
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe((status) => {
        console.log('Deals subscription status:', status);
      });

    channelRef.current = dealsChannel;

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up deals subscription');
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
