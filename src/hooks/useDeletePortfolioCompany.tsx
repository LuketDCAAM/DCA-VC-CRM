import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDeletePortfolioCompany() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteCompany = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('portfolio_companies').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Company deleted', description: 'The portfolio company was removed.' });
      return true;
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete the portfolio company.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteCompanies = async (ids: string[]) => {
    if (ids.length === 0) return true;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('portfolio_companies').delete().in('id', ids);
      if (error) throw error;
      toast({
        title: 'Companies deleted',
        description: `${ids.length} portfolio compan${ids.length === 1 ? 'y' : 'ies'} removed.`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Could not delete the selected companies.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCompany, deleteCompanies, isDeleting };
}
