import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal';
import { useToast } from '@/hooks/use-toast';

export function usePriorityDeals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: priorityDeals, isLoading } = useQuery({
    queryKey: ['priority-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('is_priority_deal', true)
        .order('priority_rank', { ascending: true });

      if (error) throw error;
      return data as Deal[];
    },
  });

  const updatePriorityRankings = useMutation({
    mutationFn: async (rankings: { id: string; priority_rank: number }[]) => {
      const updates = rankings.map(({ id, priority_rank }) => 
        supabase
          .from('deals')
          .update({ priority_rank })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error('Failed to update some rankings');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priority-deals'] });
      toast({
        title: "Rankings updated",
        description: "Priority deal rankings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update rankings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const togglePriorityStatus = useMutation({
    mutationFn: async ({ dealId, isPriority }: { dealId: string; isPriority: boolean }) => {
      const { error } = await supabase
        .from('deals')
        .update({ 
          is_priority_deal: isPriority,
          priority_rank: isPriority ? null : null // Let trigger handle rank assignment
        })
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priority-deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        title: "Priority status updated",
        description: "Deal priority status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update priority status. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    priorityDeals: priorityDeals || [],
    isLoading,
    updatePriorityRankings,
    togglePriorityStatus,
    isUpdating: updatePriorityRankings.isPending || togglePriorityStatus.isPending,
  };
}