import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDateOnly } from '@/lib/outreach/constants';

/** How many of my follow-ups are due today or already late. */
export function useDueFollowUpCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    const today = formatDateOnly(new Date());
    const { count: due } = await supabase
      .from('outreach_follow_ups')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .lte('due_date', today)
      .not('status', 'in', '("sent","done","snoozed")');
    setCount(due || 0);
  }, [user]);

  useEffect(() => {
    fetchCount();
    if (!user) return;
    const channel = supabase
      .channel(`due-follow-up-count-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outreach_follow_ups' }, () => {
        fetchCount();
      })
      .subscribe();
    const interval = setInterval(fetchCount, 60000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchCount, user]);

  return { count, refetch: fetchCount };
}
