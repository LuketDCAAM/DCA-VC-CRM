
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface DealFilters {
  pipeline_stage?: string[];
  round_stage?: string[];
  sector?: string[];
  location?: string[];
  deal_source?: string[];
  searchTerm?: string;
}

export interface UsePaginatedDealsReturn {
  deals: Deal[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  isRefetching: boolean;
  error: string | null;
}

export function usePaginatedDeals(
  pagination: PaginationConfig,
  filters: DealFilters = {}
): UsePaginatedDealsReturn {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const hasMore = deals.length < total;

  useEffect(() => {
    if (!user) return;

    const fetchDeals = async () => {
      try {
        if (pagination.page === 1) {
          setLoading(true);
        } else {
          setIsRefetching(true);
        }

        setError(null);

        // Build the query
        let query = supabase
          .from('deals')
          .select('*', { count: 'exact' })
          .eq('created_by', user.id);

        // Apply filters
        if (filters.pipeline_stage && filters.pipeline_stage.length > 0) {
          query = query.in('pipeline_stage', filters.pipeline_stage);
        }

        if (filters.round_stage && filters.round_stage.length > 0) {
          query = query.in('round_stage', filters.round_stage);
        }

        if (filters.sector && filters.sector.length > 0) {
          query = query.in('sector', filters.sector);
        }

        if (filters.location && filters.location.length > 0) {
          query = query.in('location', filters.location);
        }

        if (filters.deal_source && filters.deal_source.length > 0) {
          query = query.in('deal_source', filters.deal_source);
        }

        // Apply search filter
        if (filters.searchTerm && filters.searchTerm.trim()) {
          const searchTerm = filters.searchTerm.trim();
          query = query.or(`company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,sector.ilike.%${searchTerm}%`);
        }

        // Apply pagination
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        query = query
          .range(startIndex, startIndex + pagination.pageSize - 1)
          .order('updated_at', { ascending: false });

        const { data, error: queryError, count } = await query;

        if (queryError) {
          console.error('Error fetching paginated deals:', queryError);
          setError(queryError.message);
          return;
        }

        // Cast the data to Deal[] type - we know this is safe because we're selecting from the deals table
        const fetchedDeals = (data || []) as Deal[];
        
        if (pagination.page === 1) {
          setDeals(fetchedDeals);
        } else {
          setDeals(prev => [...prev, ...fetchedDeals]);
        }
        
        setTotal(count || 0);

      } catch (error: any) {
        console.error('Error in fetchDeals:', error);
        setError(error.message || 'An error occurred while fetching deals');
      } finally {
        setLoading(false);
        setIsRefetching(false);
      }
    };

    fetchDeals();
  }, [user, pagination.page, pagination.pageSize, filters]);

  // Reset deals when filters change or when starting a new search
  useEffect(() => {
    if (pagination.page === 1) {
      setDeals([]);
    }
  }, [
    filters.pipeline_stage,
    filters.round_stage, 
    filters.sector,
    filters.location,
    filters.deal_source,
    filters.searchTerm
  ]);

  return {
    deals,
    total,
    hasMore,
    loading,
    isRefetching,
    error
  };
}
