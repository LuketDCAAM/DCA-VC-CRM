
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarSyncLog {
  id: string;
  user_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  events_processed: number | null;
  deals_updated: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useOutlookCalendarSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState<CalendarSyncLog[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSyncLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('outlook_calendar_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedLogs: CalendarSyncLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        sync_type: log.sync_type,
        status: log.status,
        started_at: log.started_at,
        completed_at: log.completed_at,
        events_processed: log.events_processed,
        deals_updated: log.deals_updated,
        error_message: log.error_message,
        created_at: log.created_at,
        updated_at: log.updated_at,
      }));

      setSyncLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const syncCalendar = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to sync calendar",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Calendar sync completed successfully",
      });

      // Refresh sync logs
      await fetchSyncLogs();
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast({
        title: "Error",
        description: "Failed to sync calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    syncLogs,
    syncCalendar,
    fetchSyncLogs,
  };
}
