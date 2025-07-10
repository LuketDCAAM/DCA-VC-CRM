
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SyncLog {
  id: string;
  user_id: string;
  sync_type: string; // Changed from union type to string to match database
  status: string; // Changed from union type to string to match database
  items_processed: number | null;
  items_failed: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export function useOutlookSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSyncLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('outlook_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const syncFromOutlook = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('outlook-sync', {
        body: { 
          user_id: user.id,
          sync_type: 'incremental'
        }
      });

      if (error) throw error;

      toast({
        title: "Sync initiated",
        description: "Syncing tasks from Outlook to your reminders.",
      });

      fetchSyncLogs();
    } catch (error: any) {
      console.error('Error syncing from Outlook:', error);
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const pushToOutlook = async (reminderId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('outlook-push', {
        body: { 
          user_id: user.id,
          reminder_id: reminderId
        }
      });

      if (error) throw error;

      toast({
        title: "Task pushed to Outlook",
        description: "Reminder has been created in your Outlook tasks.",
      });
    } catch (error: any) {
      console.error('Error pushing to Outlook:', error);
      toast({
        title: "Push failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fullSync = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('outlook-sync', {
        body: { 
          user_id: user.id,
          sync_type: 'full'
        }
      });

      if (error) throw error;

      toast({
        title: "Full sync initiated",
        description: "Performing complete sync between Outlook and reminders.",
      });

      fetchSyncLogs();
    } catch (error: any) {
      console.error('Error performing full sync:', error);
      toast({
        title: "Full sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    syncLogs,
    syncFromOutlook,
    pushToOutlook,
    fullSync,
    fetchSyncLogs,
  };
}
