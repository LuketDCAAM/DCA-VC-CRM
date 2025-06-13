
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type InvestmentStage = Database['public']['Enums']['investment_stage'];

interface Investor {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  firm_name: string | null;
  firm_website: string | null;
  location: string | null;
  preferred_investment_stage: InvestmentStage | null;
  average_check_size: number | null;
  preferred_sectors: string[] | null;
  tags: string[] | null;
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
}

export function useInvestors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvestors = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestors(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching investors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, [user]);

  return {
    investors,
    loading,
    refetch: fetchInvestors,
  };
}
