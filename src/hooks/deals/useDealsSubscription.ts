
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cache channels, subscribers, and subscription status by user ID
const channelsByUserId: Record<string, any> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};
const subscriptionStatusByUserId: Record<string, 'subscribing' | 'subscribed' | 'unsubscribed'> = {};

export function useDealsSubscription(
  userId: string | undefined,
  queryKey: (string | undefined)[]
) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    console.log(`[DealsSubscription] Setting up subscription for user: ${userId}`);

    if (!subscribersByUserId[userId]) {
      subscribersByUserId[userId] = new Set();
    }

    const invalidateFunction = () => {
      if (queryKeyRef.current) {
        console.log(`[DealsSubscription] Invalidating deals query for user: ${userId}`);
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    subscribersByUserId[userId].add(invalidateFunction);

    // Only create new channel if one doesn't exist or is unsubscribed
    if (!channelsByUserId[userId] || subscriptionStatusByUserId[userId] === 'unsubscribed') {
      console.log(`[DealsSubscription] Creating new channel for user: ${userId}`);
      
      // Mark as subscribing to prevent race conditions
      subscriptionStatusByUserId[userId] = 'subscribing';
      
      const channelName = `deals-global-${userId}-${Date.now()}`;
      const channel = supabase.channel(channelName);

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
            console.log(`[DealsSubscription] Received change for user ${userId}:`, payload);
            subscribersByUserId[userId]?.forEach((sub) => sub());
          }
        )
        .subscribe((status: string) => {
          console.log(`[DealsSubscription] Subscription status for user ${userId}:`, status);
          if (status === 'SUBSCRIBED') {
            subscriptionStatusByUserId[userId] = 'subscribed';
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            subscriptionStatusByUserId[userId] = 'unsubscribed';
            delete channelsByUserId[userId];
            delete subscribersByUserId[userId];
            delete subscriptionStatusByUserId[userId];
          }
        });

      channelsByUserId[userId] = channel;
    } else {
      console.log(`[DealsSubscription] Reusing existing channel for user: ${userId}`);
    }

    return () => {
      console.log(`[DealsSubscription] Cleanup for user: ${userId}`);
      
      if (subscribersByUserId[userId]) {
        subscribersByUserId[userId].delete(invalidateFunction);

        if (
          subscribersByUserId[userId].size === 0 &&
          channelsByUserId[userId]
        ) {
          const channel = channelsByUserId[userId];
          
          console.log(`[DealsSubscription] Unsubscribing channel for user: ${userId}`);
          
          if (channel && typeof channel.unsubscribe === 'function') {
            try {
              channel.unsubscribe();
              subscriptionStatusByUserId[userId] = 'unsubscribed';
            } catch (error) {
              console.warn(`[DealsSubscription] Error unsubscribing:`, error);
            }
          }
          
          if (channel) {
            try {
              supabase.removeChannel(channel);
            } catch (error) {
              console.warn(`[DealsSubscription] Error removing channel:`, error);
            }
          }
          
          delete channelsByUserId[userId];
          delete subscribersByUserId[userId];
          delete subscriptionStatusByUserId[userId];
        }
      }
    };
  }, [userId, queryClient]);

  return null;
}
