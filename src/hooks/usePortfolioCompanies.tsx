
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';
import { useEffect, useMemo } from 'react';

type CompanyStatus = Database['public']['Enums']['company_status'];

export interface PortfolioCompany {
  id: string;
  company_name: string;
  description: string | null;
  status: CompanyStatus;
  tags: string[] | null;
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
  investments: Array<{
    id: string;
    investment_date: string;
    amount_invested: number;
    post_money_valuation: number | null;
    price_per_share: number | null;
    revenue_at_investment: number | null;
    ownership_percentage: number | null;
  }>;
  current_valuation: {
    last_round_post_money_valuation: number | null;
    last_round_price_per_share: number | null;
    current_ownership_percentage: number | null;
  } | null;
}

async function fetchCompanies(userId: string): Promise<PortfolioCompany[]> {
  console.log('=== FETCH PORTFOLIO COMPANIES DEBUG ===');
  console.log('Fetching portfolio companies for user:', userId);
  
  // Check authentication and approval
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('Current authenticated user:', user?.id);
  
  if (authError || !user) {
    console.error('Authentication error:', authError);
    throw new Error('Authentication failed');
  }
  
  // Check approval status
  const { data: approvalData, error: approvalError } = await supabase
    .from('user_approvals')
    .select('status')
    .eq('user_id', user.id)
    .single();
    
  console.log('Approval data:', approvalData);
  
  if (approvalError && approvalError.code !== 'PGRST116') {
    console.error('Error checking approval:', approvalError);
  }
  
  if (!approvalData || approvalData.status !== 'approved') {
    console.warn('User not approved for portfolio companies. Status:', approvalData?.status || 'not found');
    return [];
  }
  
  console.log('User approved, fetching portfolio companies...');
  
  const { data, error } = await supabase
    .from('portfolio_companies')
    .select(`
      *,
      investments (*),
      current_valuations (
        last_round_post_money_valuation,
        last_round_price_per_share,
        current_ownership_percentage
      )
    `)
    .order('created_at', { ascending: false });

  console.log('Portfolio companies query result:');
  console.log('- Data:', data);
  console.log('- Error:', error);

  if (error) {
    console.error("Error fetching portfolio companies:", error);
    throw new Error(error.message);
  }

  const companies = data?.map(company => ({
    ...company,
    current_valuation: company.current_valuations?.[0] || null
  })) || [];
  
  console.log('📊 PORTFOLIO COMPANIES FETCHED:', companies.length);
  console.log('=== END FETCH PORTFOLIO COMPANIES DEBUG ===');

  return companies;
}

export function usePortfolioCompanies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['portfolioCompanies', user?.id], [user?.id]);

  const {
    data: companies = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!user?.id) return [];
      return fetchCompanies(user.id);
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    const companiesChannel = supabase
      .channel('custom-portfolio-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_companies',
        },
        (payload) => {
          console.log('Portfolio companies change received!', payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(companiesChannel);
      } catch (error) {
        console.warn('Error removing portfolio companies channel:', error);
      }
    };
  }, [user?.id, queryClient, queryKey]);

  return {
    companies,
    loading,
    refetch,
  };
}
