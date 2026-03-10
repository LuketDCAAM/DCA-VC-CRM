
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useOpenTaskCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      // Count tasks directly assigned to user
      const { count: directCount } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('task_type', 'task')
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress']);

      // Count tasks via task_assignments
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('assigned_to', user.id);

      let assignmentCount = 0;
      if (assignments && assignments.length > 0) {
        const taskIds = assignments.map(a => a.task_id);
        const { count: c } = await supabase
          .from('reminders')
          .select('*', { count: 'exact', head: true })
          .eq('task_type', 'task')
          .in('id', taskIds)
          .in('status', ['pending', 'in_progress']);
        assignmentCount = c || 0;
      }

      setCount(Math.max(directCount || 0, assignmentCount));
    } catch (error) {
      console.error('Error fetching open task count:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
