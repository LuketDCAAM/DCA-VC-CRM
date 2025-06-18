
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const channelsByUserId: Record<string, ReturnType<typeof supabase.channel>> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};
const subscribedFlags: Record<string, boolean> = {};

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

    const invalidate = () => {
      if (queryKeyRef.current) {
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    subscribersByUserId[userId].add(invalidate);

    if (!channelsByUserId[userId]) {
      const channel = supabase.channel(`deals-global-${userId}`);
      channelsByUserId[userId] = channel;
    }

    const channel = channelsByUserId[userId];

    // ✅ only subscribe once
    if (!subscribedFlags[userId]) {
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals',
            filter: `created_by=eq.${userId}`,
          },
          () => {
            subscribersByUserId[userId]?.forEach((fn) => fn());
          }
        )
        .subscribe((status) => {
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            delete channelsByUserId[userId];
            delete subscribersByUserId[userId];
            delete subscribedFlags[userId];
          }
        });

      subscribedFlags[userId] = true;
    }

    return () => {
      subscribersByUserId[userId]?.delete(invalidate);

      if (
        subscribersByUserId[userId]?.size === 0 &&
        channelsByUserId[userId]
      ) {
        supabase.removeChannel(channelsByUserId[userId]);
        delete channelsByUserId[userId];
        delete subscribersByUserId[userId];
        delete subscribedFlags[userId];
      }
    };
  }, [userId, queryClient]);
}
