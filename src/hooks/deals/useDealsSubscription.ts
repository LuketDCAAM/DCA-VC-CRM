
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }

    const channel = supabase.channel(`deals_${userId}`);
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        () => {
          // Debounce bursts of changes (bulk imports, etc.) into a single refetch
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey });
          }, 500);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
    };
  }, [userId, queryClient, queryKey]);

  return null;
}
