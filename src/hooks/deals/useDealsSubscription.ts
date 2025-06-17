
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Global subscription state to prevent multiple subscriptions
let globalChannel: any = null;
let subscribers: Set<() => void> = new Set();
let globalSubscribed = false;

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef<(string | undefined)[]>();

  // Store the query key in ref so it can be used from subscription
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    // Add this instance's invalidation function to subscribers
    const invalidateFunction = () => {
      if (queryKeyRef.current) {
        console.log('Invalidating deals query...');
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };
    subscribers.add(invalidateFunction);

    // Set up global subscription only if it doesn't exist
    if (!globalChannel || !globalSubscribed) {
  console.log('Setting up global deals subscription');

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
        console.log('=== DEALS REALTIME UPDATE ===');
        console.log('Event:', payload.eventType);
        console.log('Table:', payload.table);
        console.log('Payload:', payload);

        // Notify all subscribers
        subscribers.forEach(subscriber => subscriber());
      }
    )
    .subscribe((status: string) => {
      console.log('Deals subscription status:', status);
      if (status === 'SUBSCRIBED') {
        globalSubscribed = true;
      }
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        globalChannel = null;
        globalSubscribed = false;
      }
    });
}

    return () => {
      subscribers.delete(invalidateFunction);
      
      // Only remove the global channel if no more subscribers
      if (subscribers.size === 0 && globalChannel) {
  console.log('Cleaning up global deals subscription');
  try {
    globalChannel.unsubscribe();
    supabase.removeChannel(globalChannel);
  } catch (error) {
    console.log('Error cleaning up channel:', error);
  }
  globalChannel = null;
  globalSubscribed = false;
}
    };
  }, [userId, queryClient]);

  return useRef(globalChannel);
}
