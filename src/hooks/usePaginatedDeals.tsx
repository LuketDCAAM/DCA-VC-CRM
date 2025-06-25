
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal, PipelineStage, RoundStage } from '@/types/deal';

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface DealFilters {
  pipeline_stage?: string[];
  round_stage?: string[];
  sector?: string[];
  location?: string[];
  search?: string;
}

interface PaginatedDealsResult {
  deals: Deal[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  isRefetching: boolean;
}

export function usePaginatedDeals(
  pagination: PaginationConfig,
  filters: DealFilters = {}
): PaginatedDealsResult {
  const { user } = useAuth();
  const [allDeals, setAllDeals] = useState<Deal[]>([]);

  // First, fetch all deals to get the complete dataset
  const { data: fetchedDeals = [], isLoading, isRefetching } = useQuery({
    queryKey: ['all-deals', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching all deals for pagination...');

      // Start with base query - remove any limits to get all data
      let query = supabase
        .from('deals')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // Apply filters with proper type casting
      if (filters.pipeline_stage && filters.pipeline_stage.length > 0) {
        query = query.in('pipeline_stage', filters.pipeline_stage as PipelineStage[]);
      }

      if (filters.round_stage && filters.round_stage.length > 0) {
        query = query.in('round_stage', filters.round_stage as RoundStage[]);
      }

      if (filters.sector && filters.sector.length > 0) {
        query = query.in('sector', filters.sector);
      }

      if (filters.location && filters.location.length > 0) {
        query = query.in('location', filters.location);
      }

      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%`);
      }

      // Fetch all data by using a large limit and handling pagination internally
      const PAGE_SIZE = 1000;
      let allResults: Deal[] = [];
      let page = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const { data, error } = await query
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
          console.error('Error fetching deals:', error);
          throw new Error(error.message);
        }

        if (data && data.length > 0) {
          allResults = [...allResults, ...data];
          
          // If we got less than PAGE_SIZE results, we've reached the end
          if (data.length < PAGE_SIZE) {
            hasMoreData = false;
          } else {
            page++;
          }
        } else {
          hasMoreData = false;
        }
      }

      console.log(`Fetched ${allResults.length} total deals`);
      return allResults as Deal[];
    },
    enabled: !!user?.id,
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Update allDeals when fetchedDeals changes
  useEffect(() => {
    if (fetchedDeals) {
      setAllDeals(fetchedDeals);
    }
  }, [fetchedDeals]);

  // Calculate pagination from the complete dataset
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedDeals = allDeals.slice(startIndex, endIndex);
  const total = allDeals.length;
  const hasMore = endIndex < total;

  console.log(`Pagination: page ${pagination.page}, showing ${paginatedDeals.length} of ${total} deals`);

  return {
    deals: paginatedDeals,
    total,
    hasMore,
    loading: isLoading,
    isRefetching,
  };
}
