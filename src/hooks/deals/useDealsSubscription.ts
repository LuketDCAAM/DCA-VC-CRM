
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Global maps to keep track of channels and subscribers per userId
const dealsChannelsMap: Record<string, any> = {};
const dealsSubscribersMap: Record<string, Set<() => void>> = {};

function getOrCreateDealsChannel(userId: string) {
  if (!dealsChannelsMap[userId]) {
    const channel = supabase.channel(`deals-global-${userId}`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'deals',
        filter: `created_by=eq.${userId}`,
      },
      () => {
        // Notify all subscribers for this userId
        if (dealsSubscribersMap[userId]) {
          dealsSubscribersMap[userId].forEach((callback) => callback());
        }
      }
    );

    dealsChannelsMap[userId] = channel;
    dealsSubscribersMap[userId] = new Set();
  }
  return dealsChannelsMap[userId];
}

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);

  // Keep queryKey ref updated
  useEffect(() => {
    queryKeyRef.current = queryKey;
  }, [queryKey]);

  useEffect(() => {
    if (!userId) return;

    const channel = getOrCreateDealsChannel(userId);

    // Function to invalidate queries
    const invalidateFn = () => {
      if (queryKeyRef.current) {
        console.log('Invalidating deals query...');
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    // Add this hook's invalidate function to subscribers
    dealsSubscribersMap[userId].add(invalidateFn);

    // Subscribe once per channel instance
    if (!channel.isSubscribed) {
      channel.subscribe((status: string) => {
        console.log(`Deals subscription status for user ${userId}:`, status);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          delete dealsChannelsMap[userId];
          delete dealsSubscribersMap[userId];
        }
      });
      channel.isSubscribed = true;
    }

    return () => {
      // Remove subscriber callback
      dealsSubscribersMap[userId].delete(invalidateFn);

      // If no subscribers remain, unsubscribe and cleanup
      if (dealsSubscribersMap[userId].size === 0) {
        if (channel.isSubscribed) {
          channel.unsubscribe();
          channel.isSubscribed = false;
        }
        delete dealsChannelsMap[userId];
        delete dealsSubscribersMap[userId];
      }
    };
  }, [userId, queryClient]);

  return useRef(dealsChannelsMap[userId]);
}
