
import { useState, useEffect, useCallback } from 'react';
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

  const fetchInvestors = useCallback(async () => {
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
  }, [user, toast]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const addInvestor = async (investorData: Omit<Investor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'relationship_owner'>) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const { data, error } = await supabase
        .from('investors')
        .insert([{ ...investorData, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      setInvestors(prev => [data, ...prev]);
      toast({ title: "Investor added", description: "The investor has been successfully added." });
      return data;
    } catch (error: any) {
      toast({ title: "Error adding investor", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const updateInvestor = async (id: string, updates: Partial<Omit<Investor, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
    try {
      const { data, error } = await supabase
        .from('investors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setInvestors(prev => prev.map(inv => inv.id === id ? data : inv));
      toast({ title: "Investor updated", description: "The investor has been successfully updated." });
      return data;
    } catch (error: any) {
      toast({ title: "Error updating investor", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const deleteInvestor = async (id: string) => {
    try {
      const { error } = await supabase.from('investors').delete().eq('id', id);
      if (error) throw error;
      setInvestors(prev => prev.filter(inv => inv.id !== id));
      toast({ title: "Investor deleted", description: "The investor has been successfully deleted." });
    } catch (error: any) {
      toast({ title: "Error deleting investor", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  return {
    investors,
    loading,
    refetch: fetchInvestors,
    addInvestor,
    updateInvestor,
    deleteInvestor,
  };
}
