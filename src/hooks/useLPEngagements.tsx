
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LPEngagement } from '@/types/lpEngagement';
import { useToast } from '@/hooks/use-toast';

export function useLPEngagements() {
  const [lpEngagements, setLPEngagements] = useState<LPEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLPEngagements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lp_engagements' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLPEngagements((data as unknown as LPEngagement[]) || []);
    } catch (err) {
      console.error('Error fetching LP engagements:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to fetch LP engagements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLPEngagement = async (engagement: Omit<LPEngagement, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lp_engagements' as any)
        .insert([{ ...engagement, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      const newEngagement = data as unknown as LPEngagement;
      setLPEngagements(prev => [newEngagement, ...prev]);
      toast({
        title: "Success",
        description: "LP engagement created successfully",
      });
    } catch (err) {
      console.error('Error adding LP engagement:', err);
      toast({
        title: "Error",
        description: "Failed to create LP engagement",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateLPEngagement = async (id: string, updates: Partial<LPEngagement>) => {
    try {
      const { data, error } = await supabase
        .from('lp_engagements' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedEngagement = data as unknown as LPEngagement;
      setLPEngagements(prev => prev.map(engagement => 
        engagement.id === id ? updatedEngagement : engagement
      ));
      
      toast({
        title: "Success",
        description: "LP engagement updated successfully",
      });
      
      return updatedEngagement;
    } catch (err) {
      console.error('Error updating LP engagement:', err);
      toast({
        title: "Error",
        description: "Failed to update LP engagement",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteLPEngagement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lp_engagements' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLPEngagements(prev => prev.filter(engagement => engagement.id !== id));
      toast({
        title: "Success",
        description: "LP engagement deleted successfully",
      });
    } catch (err) {
      console.error('Error deleting LP engagement:', err);
      toast({
        title: "Error",
        description: "Failed to delete LP engagement",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchLPEngagements();
  }, []);

  return {
    lpEngagements,
    loading,
    error,
    addLPEngagement,
    updateLPEngagement,
    deleteLPEngagement,
    refetch: fetchLPEngagements,
  };
}
