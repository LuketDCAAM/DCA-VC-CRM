
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Investor } from '@/types/investor';

export function useDealInvestors(dealId: string) {
  const [linkedInvestors, setLinkedInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinkedInvestors = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deal_investors')
        .select('investors(*)')
        .eq('deal_id', dealId);

      if (error) throw error;
      
      const investors = data.map(item => item.investors).filter(Boolean) as Investor[];
      setLinkedInvestors(investors);
    } catch (error: any) {
      toast({
        title: "Error fetching linked investors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dealId, toast]);

  useEffect(() => {
    fetchLinkedInvestors();
  }, [fetchLinkedInvestors]);

  const linkInvestor = async (investorId: string) => {
    try {
      const { error } = await supabase
        .from('deal_investors')
        .insert({ deal_id: dealId, investor_id: investorId });
      
      if (error) {
        if (error.code === '23505') { // unique_violation
          toast({ title: "Investor already linked", variant: "default" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Investor linked" });
        await fetchLinkedInvestors();
      }
    } catch (error: any) {
        toast({
            title: "Error linking investor",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  const unlinkInvestor = async (investorId: string) => {
    try {
      const { error } = await supabase
        .from('deal_investors')
        .delete()
        .eq('deal_id', dealId)
        .eq('investor_id', investorId);

      if (error) throw error;
      
      toast({ title: "Investor unlinked" });
      await fetchLinkedInvestors();
    } catch (error: any) {
        toast({
            title: "Error unlinking investor",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  return {
    linkedInvestors,
    loading,
    linkInvestor,
    unlinkInvestor,
    refetch: fetchLinkedInvestors,
  };
}
