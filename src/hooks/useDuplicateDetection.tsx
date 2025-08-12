import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PotentialDuplicate, DuplicateCheckResult } from '@/types/duplicates';
import { useToast } from '@/hooks/use-toast';

export function useDuplicateDetection() {
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkForDuplicates = async (dealData: {
    company_name: string;
    website?: string;
    linkedin_url?: string;
    contact_email?: string;
  }): Promise<DuplicateCheckResult> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsChecking(true);

    try {
      const { data, error } = await supabase.rpc('find_potential_duplicates', {
        p_company_name: dealData.company_name,
        p_website: dealData.website || null,
        p_linkedin_url: dealData.linkedin_url || null,
        p_contact_email: dealData.contact_email || null,
        p_user_id: null, // Search across all users to catch org-wide duplicates
      });

      if (error) {
        console.error('Error checking for duplicates:', error);
        toast({
          title: 'Error checking for duplicates',
          description: 'Unable to check for duplicates. Proceeding with deal creation.',
          variant: 'destructive',
        });
        return { hasDuplicates: false, duplicates: [] };
      }

      const duplicates = (data || []) as PotentialDuplicate[];
      
      return {
        hasDuplicates: duplicates.length > 0,
        duplicates,
      };
    } catch (error) {
      console.error('Error in duplicate detection:', error);
      toast({
        title: 'Error checking for duplicates',
        description: 'Unable to check for duplicates. Proceeding with deal creation.',
        variant: 'destructive',
      });
      return { hasDuplicates: false, duplicates: [] };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkForDuplicates,
    isChecking,
  };
}