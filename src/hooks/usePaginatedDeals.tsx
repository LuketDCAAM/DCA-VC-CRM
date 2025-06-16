
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { useEffect, useMemo, useId, useRef, useState } from 'react';

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface DealFilters {
  searchTerm?: string;
  pipeline_stage?: string;
  round_stage?: string;
  location?: string;
  deal_source?: string;
  round_size_min?: number;
  round_size_max?: number;
  deal_score_min?: number;
  deal_score_max?: number;
  created_at_from?: string;
  created_at_to?: string;
  source_date_from?: string;
  source_date_to?: string;
}

async function fetchPaginatedDeals(
  userId: string, 
  pagination: PaginationConfig,
  filters: DealFilters = {}
): Promise<{ deals: Deal[]; total: number; hasMore: boolean }> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('deals')
    .select('*', { count: 'exact' })
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (filters.searchTerm) {
    query = query.or(`company_name.ilike.%${filters.searchTerm}%,contact_name.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
  }
  
  if (filters.pipeline_stage) {
    query = query.eq('pipeline_stage', filters.pipeline_stage);
  }
  
  if (filters.round_stage) {
    query = query.eq('round_stage', filters.round_stage);
  }
  
  if (filters.location) {
    query = query.eq('location', filters.location);
  }
  
  if (filters.deal_source) {
    query = query.eq('deal_source', filters.deal_source);
  }
  
  if (filters.round_size_min !== undefined) {
    query = query.gte('round_size', filters.round_size_min * 100); // Convert to cents
  }
  
  if (filters.round_size_max !== undefined) {
    query = query.lte('round_size', filters.round_size_max * 100); // Convert to cents
  }
  
  if (filters.deal_score_min !== undefined) {
    query = query.gte('deal_score', filters.deal_score_min);
  }
  
  if (filters.deal_score_max !== undefined) {
    query = query.lte('deal_score', filters.deal_score_max);
  }
  
  if (filters.created_at_from) {
    query = query.gte('created_at', filters.created_at_from);
  }
  
  if (filters.created_at_to) {
    query = query.lte('created_at', filters.created_at_to);
  }
  
  if (filters.source_date_from) {
    query = query.gte('source_date', filters.source_date_from);
  }
  
  if (filters.source_date_to) {
    query = query.lte('source_date', filters.source_date_to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching paginated deals:", error);
    throw new Error(error.message);
  }

  const total = count || 0;
  const hasMore = offset + pageSize < total;

  return { 
    deals: data || [], 
    total,
    hasMore 
  };
}

export function usePaginatedDeals(
  pagination: PaginationConfig = { page: 1, pageSize: 50 },
  filters: DealFilters = {}
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const id = useId();
  const channelRef = useRef<any>(null);

  const queryKey = useMemo(() => [
    'paginated-deals', 
    user?.id, 
    pagination.page, 
    pagination.pageSize,
    filters
  ], [user?.id, pagination.page, pagination.pageSize, filters]);

  const {
    data,
    isLoading: loading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!user?.id) return { deals: [], total: 0, hasMore: false };
      return fetchPaginatedDeals(user.id, pagination, filters);
    },
    enabled: !!user?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `paginated-deals-channel-${id}`;
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
          console.log('Paginated deals change received!', payload);
          // Invalidate all paginated queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['paginated-deals', user.id] });
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
  }, [user?.id, queryClient, id]);

  return {
    deals: data?.deals || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    loading,
    isRefetching,
    refetch,
  };
}
