
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

  // Fetch ALL deals from Supabase with proper chunking
  const { data: fetchedDeals = [], isLoading, isRefetching } = useQuery({
    queryKey: ['all-deals', user?.id, filters],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching ALL deals with proper chunking...');

      // Start with base query
      let baseQuery = supabase
        .from('deals')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      // Apply filters with proper type casting
      if (filters.pipeline_stage && filters.pipeline_stage.length > 0) {
        baseQuery = baseQuery.in('pipeline_stage', filters.pipeline_stage as PipelineStage[]);
      }

      if (filters.round_stage && filters.round_stage.length > 0) {
        baseQuery = baseQuery.in('round_stage', filters.round_stage as RoundStage[]);
      }

      if (filters.sector && filters.sector.length > 0) {
        baseQuery = baseQuery.in('sector', filters.sector);
      }

      if (filters.location && filters.location.length > 0) {
        baseQuery = baseQuery.in('location', filters.location);
      }

      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        baseQuery = baseQuery.or(`company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%`);
      }

      // Fetch ALL data by chunking properly
      const CHUNK_SIZE = 1000;
      let allResults: Deal[] = [];
      let offset = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        console.log(`Fetching chunk starting at offset ${offset}...`);
        
        const { data, error } = await baseQuery
          .range(offset, offset + CHUNK_SIZE - 1);

        if (error) {
          console.error('Error fetching deals chunk:', error);
          throw new Error(error.message);
        }

        if (data && data.length > 0) {
          allResults = [...allResults, ...data];
          console.log(`Fetched ${data.length} deals, total so far: ${allResults.length}`);
          
          // If we got less than CHUNK_SIZE results, we've reached the end
          if (data.length < CHUNK_SIZE) {
            hasMoreData = false;
          } else {
            offset += CHUNK_SIZE;
          }
        } else {
          hasMoreData = false;
        }
      }

      console.log(`✅ Fetched ALL ${allResults.length} deals successfully`);
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

  // Calculate client-side pagination from the complete dataset
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  const paginatedDeals = allDeals.slice(startIndex, endIndex);
  const total = allDeals.length;
  const hasMore = endIndex < total;

  console.log(`📊 Pagination: page ${pagination.page}, showing ${paginatedDeals.length} of ${total} total deals`);

  return {
    deals: paginatedDeals,
    total,
    hasMore,
    loading: isLoading,
    isRefetching,
  };
}
