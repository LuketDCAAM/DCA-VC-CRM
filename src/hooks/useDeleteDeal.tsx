import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useDeleteDeal() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const deleteDeal = async (dealId: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to delete deals.',
        variant: 'destructive',
      });
      return false;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId);

      if (error) throw error;

      toast({ title: 'Deal deleted' });
      return true;
    } catch (error) {
      console.error('useDeleteDeal - Error deleting deal:', error);
      toast({
        title: 'Failed to delete',
        description: 'Could not delete the deal. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteDeal, isDeleting };
}
