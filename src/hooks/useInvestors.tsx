
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Investor } from '@/types/investor';

export function useInvestors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvestors = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      console.log('=== FETCH INVESTORS DEBUG ===');
      console.log('Fetching investors for user:', user.id);
      
      // Check authentication and approval
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log('Current authenticated user:', currentUser?.id);
      
      if (authError || !currentUser) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }
      
      // Check approval status
      const { data: approvalData, error: approvalError } = await supabase
        .from('user_approvals')
        .select('status')
        .eq('user_id', currentUser.id)
        .single();
        
      console.log('Approval data:', approvalData);
      
      if (approvalError && approvalError.code !== 'PGRST116') {
        console.error('Error checking approval:', approvalError);
      }
      
      if (!approvalData || approvalData.status !== 'approved') {
        console.warn('User not approved for investors. Status:', approvalData?.status || 'not found');
        setInvestors([]);
        return;
      }
      
      console.log('User approved, fetching investors...');
      
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Investors query result:');
      console.log('- Data:', data);
      console.log('- Error:', error);

      if (error) throw error;
      
      console.log('📊 INVESTORS FETCHED:', data?.length || 0);
      console.log('=== END FETCH INVESTORS DEBUG ===');
      
      setInvestors(data || []);
    } catch (error: any) {
      console.error('Error in fetchInvestors:', error);
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
