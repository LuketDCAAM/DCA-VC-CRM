import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal, PipelineStage, RoundStage } from '@/types/deal'; 

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface DealFilters {
  searchTerm?: string;
  pipeline_stage?: PipelineStage; 
  round_stage?: RoundStage;
  sector?: string; 
  location?: string; 
  deal_source?: string; 
  round_size?: [number, number];
  deal_score?: [number, number];
  created_at?: { from?: Date; to?: Date };
  source_date?: { from?: Date; to?: Date };
}

export function usePaginatedDeals(pagination: PaginationConfig, filters: DealFilters = {}) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const { user } = useAuth();

  const fetchPaginatedDeals = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setIsRefetching(true);

      console.log('=== PAGINATED DEALS FETCH DEBUG ===');
      console.log('Pagination config:', pagination);
      console.log('Filters:', filters);

      // Check authentication and approval
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }

      // --- REMOVED USER APPROVAL CHECK ---
      /*
      console.log('Checking approval status...');
      const { data: approvalData, error: approvalError } = await supabase
        .from('user_approvals')
        .select('status')
        .eq('user_id', currentUser.id)
        .single();

      if (approvalError && approvalError.code !== 'PGRST116') {
        console.error('Error checking approval:', approvalError);
      }

      if (!approvalData || approvalData.status !== 'approved') {
        console.warn('User not approved for paginated deals. Status:', approvalData?.status || 'not found');
        setDeals([]);
        setTotal(0);
        return;
      }
      */
      // --- END REMOVED BLOCK ---

      console.log('User authenticated, proceeding with paginated deals fetch...'); // Adjusted log message

      let query = supabase
        .from('deals') 
        .select('*', { count: 'exact', head: false });

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`company_name.ilike.%${filters.searchTerm}%,contact_name.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.pipeline_stage) {
        // KEY CHANGE: Cast to NonNullable<PipelineStage>
        query = query.eq('pipeline_stage', filters.pipeline_stage as NonNullable<PipelineStage>); 
      }

      if (filters.round_stage) {
        // KEY CHANGE: Cast to NonNullable<RoundStage>
        query = query.eq('round_stage', filters.round_stage as NonNullable<RoundStage>); 
      }

      if (filters.sector) {
        query = query.eq('sector', filters.sector as string); 
      }

      if (filters.location) {
        query = query.eq('location', filters.location as string); 
      }

      if (filters.deal_source) {
        query = query.eq('deal_source', filters.deal_source as string); 
      }

      if (filters.round_size) {
        query = query
          .gte('round_size', filters.round_size[0])
          .lte('round_size', filters.round_size[1]);
      }

      if (filters.deal_score) {
        query = query
          .gte('deal_score', filters.deal_score[0])
          .lte('deal_score', filters.deal_score[1]);
      }

      if (filters.created_at?.from) {
        query = query.gte('created_at', filters.created_at.from.toISOString());
      }

      if (filters.created_at?.to) {
        query = query.lte('created_at', filters.created_at.to.toISOString());
      }

      if (filters.source_date?.from) {
        query = query.gte('source_date', filters.source_date.from.toISOString().split('T')[0]);
      }

      if (filters.source_date?.to) {
        query = query.lte('source_date', filters.source_date.to.toISOString().split('T')[0]);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false });

      console.log('Paginated deals query result:');
      console.log('- Data count:', data?.length || 0);
      console.log('- Total count:', count);
      console.log('- Error:', error);

      if (error) {
        console.error("Error fetching paginated deals:", error);
        throw new Error(error.message);
      }

      const fetchedDeals = (data as Deal[] | null) || []; 

      const startIndex = (pagination.page - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedData = fetchedDeals.slice(startIndex, endIndex);

      setDeals(fetchedDeals); 
      setTotal(count || 0);

      console.log('📊 PAGINATED DEALS FETCHED:', paginatedData.length, 'of', count);
      console.log('=== END PAGINATED DEALS FETCH DEBUG ===');

    } catch (error: any) {
      console.error('Error in fetchPaginatedDeals:', error);
      setDeals([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  };

  useEffect(() => {
    fetchPaginatedDeals();
  }, [user?.id, pagination.page, pagination.pageSize, JSON.stringify(filters)]);

  const hasMore = useMemo(() => {
    return (pagination.page * pagination.pageSize) < total;
  }, [pagination.page, pagination.pageSize, total]);

  return {
    deals,
    total,
    loading,
    isRefetching,
    hasMore,
    refetch: fetchPaginatedDeals,
  };
}
