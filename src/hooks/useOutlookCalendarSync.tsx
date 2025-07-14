
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  organizer?: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  body?: {
    content: string;
    contentType: string;
  };
}

interface CalendarSyncLog {
  id: string;
  user_id: string;
  sync_type: string;
  status: string;
  items_processed: number | null;
  items_failed: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export function useOutlookCalendarSync() {
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<CalendarSyncLog[]>([]);
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
      console.error('Error fetching calendar sync logs:', error);
    }
  };

  const syncCalendarEvents = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
        body: { 
          user_id: user.id,
          sync_type: 'incremental'
        }
      });

      if (error) throw error;

      toast({
        title: "Calendar sync initiated",
        description: "Syncing calendar events to update deal call dates.",
      });

      fetchSyncLogs();
    } catch (error: any) {
      console.error('Error syncing calendar:', error);
      toast({
        title: "Calendar sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const fullCalendarSync = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      
      const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
        body: { 
          user_id: user.id,
          sync_type: 'full'
        }
      });

      if (error) throw error;

      toast({
        title: "Full calendar sync initiated",
        description: "Performing complete sync of calendar events with deals.",
      });

      fetchSyncLogs();
    } catch (error: any) {
      console.error('Error performing full calendar sync:', error);
      toast({
        title: "Full calendar sync failed",
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
    syncCalendarEvents,
    fullCalendarSync,
    fetchSyncLogs,
  };
}
