
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Cache of active channels by user ID
const channelsByUserId: Record<string, any> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};
const subscriptionStatusByUserId: Record<string, 'subscribing' | 'subscribed' | 'error'> = {};

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) return;

    console.log(`[ContactsSubscription] Setting up subscription for user: ${user.id}`);

    // Initialize subscriber set for this user
    if (!subscribersByUserId[user.id]) {
      subscribersByUserId[user.id] = new Set();
    }

    // Add current refetch to subscribers for this user
    const refetchFunction = () => {
      if (refetchRef.current) {
        console.log(`[ContactsSubscription] Triggering refetch for user: ${user.id}`);
        refetchRef.current();
      }
    };
    subscribersByUserId[user.id].add(refetchFunction);

    // Only create and subscribe to a new channel if none exists for this user
    if (!channelsByUserId[user.id] || subscriptionStatusByUserId[user.id] === 'error') {
      console.log(`[ContactsSubscription] Creating new channel for user: ${user.id}`);
      
      const channelName = `contacts-${user.id}-${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Store the channel and mark as subscribing
      channelsByUserId[user.id] = channel;
      subscriptionStatusByUserId[user.id] = 'subscribing';

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contacts' },
          (payload) => {
            console.log(`[ContactsSubscription] Received change for user ${user.id}:`, payload);
            subscribersByUserId[user.id]?.forEach(sub => sub());
          }
        )
        .subscribe((status) => {
          console.log(`[ContactsSubscription] Subscription status for user ${user.id}:`, status);
          
          if (status === 'SUBSCRIBED') {
            subscriptionStatusByUserId[user.id] = 'subscribed';
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            subscriptionStatusByUserId[user.id] = 'error';
            // Clean up on error or closure
            delete channelsByUserId[user.id];
            delete subscribersByUserId[user.id];
            delete subscriptionStatusByUserId[user.id];
          }
        });
    } else {
      console.log(`[ContactsSubscription] Reusing existing channel for user: ${user.id} (status: ${subscriptionStatusByUserId[user.id]})`);
    }

    return () => {
      console.log(`[ContactsSubscription] Cleanup for user: ${user.id}`);
      
      if (subscribersByUserId[user.id]) {
        subscribersByUserId[user.id].delete(refetchFunction);

        // Only unsubscribe if no more subscribers
        if (subscribersByUserId[user.id].size === 0) {
          const channel = channelsByUserId[user.id];
          
          if (channel) {
            console.log(`[ContactsSubscription] Unsubscribing channel for user: ${user.id}`);
            
            try {
              channel.unsubscribe();
              supabase.removeChannel(channel);
            } catch (error) {
              console.warn(`[ContactsSubscription] Error cleaning up channel:`, error);
            }
          }
          
          delete channelsByUserId[user.id];
          delete subscribersByUserId[user.id];
          delete subscriptionStatusByUserId[user.id];
        }
      }
    };
  }, [user?.id]);
}
