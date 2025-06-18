
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    // Create a scoped channel for this hook instance
    const channel = supabase.channel(`deals-global-${userId}-${Date.now()}`);

    const handleUpdate = () => {
      console.log('Invalidating deals query...');
      if (queryKeyRef.current) {
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime payload:', payload);
          handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase channel error');
        }
      });

    return () => {
      // Cleanly remove the channel on unmount
      console.log('Unsubscribing deals channel...');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return null;
}
