
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { APIProvider, ExternalDataSyncResult, APIConfigurationInput } from '@/types/external-data';

// Define the types based on the actual database schema
type APIConfiguration = {
  id: string;
  provider: string;
  api_key_encrypted: string;
  base_url?: string | null;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type APISyncLog = {
  id: string;
  deal_id?: string | null;
  api_provider: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  data_fetched?: any;
  error_message?: string | null;
  records_processed: number;
  records_updated: number;
  created_by: string;
};

export const useExternalDataSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch API configurations
  const { data: apiConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['api-configurations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_configurations')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []) as APIConfiguration[];
    },
  });

  // Sync deal data with external APIs
  const syncDealData = useMutation({
    mutationFn: async ({ dealId, providers }: { dealId: string; providers: APIProvider[] }) => {
      setIsLoading(true);
      
      try {
        // Call edge function to sync external data
        const { data, error } = await supabase.functions.invoke('sync-external-data', {
          body: { dealId, providers }
        });

        if (error) throw error;
        return data as ExternalDataSyncResult[];
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        toast.success(`Successfully synced data from ${successCount} provider(s)`);
      } else {
        toast.warning(`Synced ${successCount} out of ${totalCount} providers. Check sync logs for details.`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Failed to sync external data');
    },
  });

  // Save API configuration
  const saveAPIConfig = useMutation({
    mutationFn: async (config: APIConfigurationInput) => {
      const { data, error } = await supabase
        .from('api_configurations')
        .upsert({
          provider: config.provider,
          api_key_encrypted: config.api_key, // In production, this should be encrypted
          base_url: config.base_url,
          rate_limit_per_minute: config.rate_limit_per_minute || 60,
          is_active: config.is_active ?? true,
          created_by: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single();

      if (error) throw error;
      return data as APIConfiguration;
    },
    onSuccess: () => {
      toast.success('API configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['api-configurations'] });
    },
    onError: (error) => {
      console.error('Config save error:', error);
      toast.error('Failed to save API configuration');
    },
  });

  // Fetch sync logs
  const { data: syncLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as APISyncLog[];
    },
  });

  return {
    apiConfigs,
    configsLoading,
    syncLogs,
    logsLoading,
    isLoading,
    syncDealData: syncDealData.mutate,
    saveAPIConfig: saveAPIConfig.mutate,
    isSyncing: syncDealData.isPending,
    isSavingConfig: saveAPIConfig.isPending,
  };
};
