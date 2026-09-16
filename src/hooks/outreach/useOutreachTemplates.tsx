import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type OutreachTemplate = Database['public']['Tables']['outreach_templates']['Row'];

export function useOutreachTemplates() {
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('outreach_templates')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({ title: 'Could not load email styles', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateTemplate = async (id: string, updates: Partial<OutreachTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('outreach_templates')
        .update({ ...updates, updated_by: user?.id ?? null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setTemplates((prev) => prev.map((t) => (t.id === id ? data : t)));
      toast({ title: 'Saved' });
      return data;
    } catch (error: any) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  return { templates, loading, updateTemplate, refetch: fetchTemplates };
}
