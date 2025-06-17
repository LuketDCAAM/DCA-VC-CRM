
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Global state
let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let subscribers: Set<() => void> = new Set();
let hasSubscribed = false;

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    // Function to invalidate queries on update
    const invalidate = () => {
      if (queryKeyRef.current) {
        console.log('Invalidating deals queries...');
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    subscribers.add(invalidate);

    if (!globalChannel) {
      const channelName = `deals-global-${userId}`;
      console.log('Creating new deals channel:', channelName);
      globalChannel = supabase.channel(channelName);
    }

    if (globalChannel && !hasSubscribed) {
      hasSubscribed = true;

      globalChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals',
            filter: `created_by=eq.${userId}`,
          },
          (payload) => {
            console.log('Deals realtime update:', payload);
            subscribers.forEach((fn) => fn());
          }
        )
        .subscribe((status: string) => {
          console.log('Deals channel status:', status);
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            globalChannel = null;
            hasSubscribed = false;
          }
        });
    }

    return () => {
      subscribers.delete(invalidate);

      if (subscribers.size === 0 && globalChannel) {
        console.log('Unsubscribing from global deals channel...');
        globalChannel
          .unsubscribe()
          .then(() => {
            if (globalChannel) supabase.removeChannel(globalChannel);
          })
          .catch((err) => console.warn('Error unsubscribing:', err));

        globalChannel = null;
        hasSubscribed = false;
      }
    };
  }, [userId, queryClient]);

  return useRef(globalChannel);
}
