
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export interface DealFilters {
  searchTerm?: string;
  pipeline_stage?: string;
  round_stage?: string;
  sector?: string;
  location?: string;
  round_size?: [number, number];
  deal_score?: [number, number];
  created_at?: { from?: Date; to?: Date };
  deal_source?: string;
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

      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }

      const { data: approvalData, error: approvalError } = await supabase
        .from('user_approvals')
        .select('status')
        .eq('user_id', currentUser.id)
        .single();

      if (!approvalData || approvalData.status !== 'approved') {
        setDeals([]);
        setTotal(0);
        return;
      }

      let query = supabase
        .from('deals')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`company_name.ilike.%${filters.searchTerm}%,contact_name.ilike.%${filters.searchTerm}%,location.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }
      if (filters.pipeline_stage) query = query.eq('pipeline_stage', filters.pipeline_stage);
      if (filters.round_stage) query = query.eq('round_stage', filters.round_stage);
      if (filters.sector) query = query.eq('sector', filters.sector);
      if (filters.location) query = query.eq('location', filters.location);
      if (filters.deal_source) query = query.eq('deal_source', filters.deal_source);

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
      if (filters.created_at?.from) query = query.gte('created_at', filters.created_at.from.toISOString());
      if (filters.created_at?.to) query = query.lte('created_at', filters.created_at.to.toISOString());
      if (filters.source_date?.from) query = query.gte('source_date', filters.source_date.from.toISOString().split('T')[0]);
      if (filters.source_date?.to) query = query.lte('source_date', filters.source_date.to.toISOString().split('T')[0]);

      // Apply pagination via .range()
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error fetching paginated deals:", error);
        throw new Error(error.message);
      }

      setDeals(data || []);
      setTotal(count || 0);
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

