
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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

export function usePortfolioCompanies() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      setLoading(true);
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

      if (error) throw error;

      const companiesData = data?.map(company => ({
        ...company,
        current_valuation: company.current_valuations?.[0] || null
      })) || [];

      setCompanies(companiesData);
    } catch (error: any) {
      toast({
        title: "Error fetching portfolio companies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [user]);

  return {
    companies,
    loading,
    refetch: fetchCompanies,
  };
}
