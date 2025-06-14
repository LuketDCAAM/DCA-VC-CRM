
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type CompanyStatus = Database['public']['Enums']['company_status'];

interface PortfolioCompany {
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
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching portfolio companies:", error);
    throw new Error(error.message);
  }

  return data?.map(company => ({
    ...company,
    current_valuation: company.current_valuations?.[0] || null
  })) || [];
}

export function usePortfolioCompanies() {
  const { user } = useAuth();

  const {
    data: companies = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['portfolioCompanies', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return fetchCompanies(user.id);
    },
    enabled: !!user?.id,
  });

  return {
    companies,
    loading,
    refetch,
  };
}
