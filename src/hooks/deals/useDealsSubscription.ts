
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cache channels and subscribers by user ID
const channelsByUserId: Record<string, any> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};

export function useDealsSubscription(
  userId: string | undefined,
  queryKey: (string | undefined)[]
) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    if (!subscribersByUserId[userId]) {
      subscribersByUserId[userId] = new Set();
    }

    const invalidateFunction = () => {
      if (queryKeyRef.current) {
        console.log('Invalidating deals query...');
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    subscribersByUserId[userId].add(invalidateFunction);

    if (!channelsByUserId[userId]) {
      const channel = supabase.channel(`deals-global-${userId}`);

      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals',
            filter: `created_by=eq.${userId}`,
          },
          (payload: any) => {
            console.log('=== DEALS REALTIME UPDATE ===', payload);
            subscribersByUserId[userId]?.forEach((sub) => sub());
          }
        )
        .subscribe((status: string) => {
          console.log('Deals subscription status:', status);
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            delete channelsByUserId[userId];
            delete subscribersByUserId[userId];
          }
        });

      channelsByUserId[userId] = channel;
    }

    return () => {
      if (subscribersByUserId[userId]) {
        subscribersByUserId[userId].delete(invalidateFunction);

        if (
          subscribersByUserId[userId].size === 0 &&
          channelsByUserId[userId]
        ) {
          channelsByUserId[userId].unsubscribe();
          supabase.removeChannel(channelsByUserId[userId]);
          delete channelsByUserId[userId];
          delete subscribersByUserId[userId];
        }
      }
    };
  }, [userId, queryClient]);

  return null;
}
