
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOpenTaskCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
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
  };

  useEffect(() => {
    fetchCount();
    
    // Subscribe to changes in reminders table
    const channel = supabase
      .channel('open-task-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
}
