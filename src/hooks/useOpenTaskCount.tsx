
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOpenTaskCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      const { count: taskCount, error } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('task_type', 'task')
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;
      setCount(taskCount || 0);
    } catch (error) {
      console.error('Error fetching open task count:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    
    // Subscribe to changes in reminders table for real-time updates
    const channel = supabase
      .channel('open-task-count-realtime')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reminders' 
        },
        () => {
          fetchCount();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'reminders' 
        },
        () => {
          fetchCount();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'reminders' 
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    // Also poll every 30 seconds as a fallback
    const interval = setInterval(fetchCount, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}
