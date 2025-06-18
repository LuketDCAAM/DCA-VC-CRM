
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cache only subscribers (no longer sharing channels)
const subscribersByUserId: Record<string, Set<() => void>> = {};

export function useDealsSubscription(
  userId: string | undefined,
  queryKey: (string | undefined)[]
) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  const channelRef = useRef<any>(null);

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

    // Create new channel for this hook instance
    const channel = supabase.channel(`deals-global-${userId}-${Date.now()}`);
    channelRef.current = channel;

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
      });

    return () => {
      subscribersByUserId[userId].delete(invalidateFunction);
      if (subscribersByUserId[userId].size === 0) {
        delete subscribersByUserId[userId];
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, queryClient]);

  return null;
}
