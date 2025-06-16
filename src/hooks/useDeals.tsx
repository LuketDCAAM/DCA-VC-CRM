
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useEffect, useMemo, useId, useRef } from 'react';

async function fetchDeals(userId: string): Promise<Deal[]> {
  console.log('=== FETCH DEALS DEBUG ===');
  console.log('Fetching deals for user:', userId);
  
  // First, let's check the total count in the database for this user
  const { count: totalCount, error: countError } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId);

  if (countError) {
    console.error("Error getting total count:", countError);
  } else {
    console.log('🔍 TOTAL DEALS IN DATABASE for user:', totalCount);
  }

  // Now fetch the actual data with increased limit
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(10000); // Add limit to prevent hitting default 1000-row limit

  if (error) {
    console.error("Error fetching deals:", error);
    throw new Error(error.message);
  }
  
  console.log('📊 FETCHED DEALS COUNT:', data?.length || 0);
  console.log('📊 DATABASE TOTAL COUNT:', totalCount);
  
  if (data && totalCount && data.length !== totalCount) {
    console.warn('⚠️ MISMATCH: Fetched', data.length, 'but database reports', totalCount, 'total');
  }
  
  console.log('Pipeline stage distribution:', data?.reduce((acc, deal) => {
    acc[deal.pipeline_stage] = (acc[deal.pipeline_stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));
  
  // Let's also check if there are deals for other users to understand the total scope
  const { count: globalCount, error: globalError } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true });
    
  if (!globalError) {
    console.log('🌍 TOTAL DEALS IN ENTIRE DATABASE:', globalCount);
  }
  
  console.log('=== END FETCH DEALS DEBUG ===');
  
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

export const SCREENING_STAGES = [
  'Seen Not Reviewed',
  'Initial Review'
];

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
