import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Global store for the channel and state
let globalChannel: any = null;
let isSubscribed = false;
const subscribers: Set<() => void> = new Set();

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);

  // Always keep latest queryKey
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    // Function to invalidate react-query cache
    const invalidate = () => {
      if (queryKeyRef.current) {
        console.log('Invalidating deals query...');
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    // Add this hook's invalidate function to the global set
    subscribers.add(invalidate);

    // Only create and subscribe once
    if (!globalChannel) {
      const channelName = `deals-global-${userId}`;
      globalChannel = supabase.channel(channelName);

      globalChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals',
            filter: `created_by=eq.${userId}`,
          },
          (payload: any) => {
            console.log('🔥 DEALS REALTIME UPDATE');
            subscribers.forEach(fn => fn());
          }
        )
        .subscribe((status: string) => {
          console.log('Deals subscription status:', status);
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            globalChannel = null;
            isSubscribed = false;
          }
        });
    }

    // 🧼 Cleanup: remove this hook’s subscriber
    return () => {
      subscribers.delete(invalidate);

      if (subscribers.size === 0 && globalChannel) {
        console.log('Cleaning up global deals subscription');
        try {
          globalChannel.unsubscribe();
          supabase.removeChannel(globalChannel);
        } catch (error) {
          console.warn('Error cleaning up deals subscription:', error);
        }
        globalChannel = null;
        isSubscribed = false;
      }
    };
  }, [userId, queryClient]);
}
