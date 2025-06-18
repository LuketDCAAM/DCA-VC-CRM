
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Cache of active channels and subscription status by user ID
const channelsByUserId: Record<string, any> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};
const subscriptionStatusByUserId: Record<string, 'subscribing' | 'subscribed' | 'unsubscribed'> = {};

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

    // If channel for this user doesn't exist or is unsubscribed, create and subscribe
    if (!channelsByUserId[user.id] || subscriptionStatusByUserId[user.id] === 'unsubscribed') {
      console.log(`[ContactsSubscription] Creating new channel for user: ${user.id}`);
      
      // Mark as subscribing to prevent race conditions
      subscriptionStatusByUserId[user.id] = 'subscribing';
      
      const channelName = `contacts-global-${user.id}-${Date.now()}`;
      const channel = supabase.channel(channelName);

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
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            subscriptionStatusByUserId[user.id] = 'unsubscribed';
            delete channelsByUserId[user.id];
            delete subscribersByUserId[user.id];
            delete subscriptionStatusByUserId[user.id];
          }
        });

      channelsByUserId[user.id] = channel;
    } else {
      console.log(`[ContactsSubscription] Reusing existing channel for user: ${user.id}`);
    }

    return () => {
      console.log(`[ContactsSubscription] Cleanup for user: ${user.id}`);
      
      if (subscribersByUserId[user.id]) {
        subscribersByUserId[user.id].delete(refetchFunction);

        // Only unsubscribe if no more subscribers
        if (subscribersByUserId[user.id].size === 0 && channelsByUserId[user.id]) {
          const channel = channelsByUserId[user.id];
          
          console.log(`[ContactsSubscription] Unsubscribing channel for user: ${user.id}`);
          
          if (channel && typeof channel.unsubscribe === 'function') {
            try {
              channel.unsubscribe();
              subscriptionStatusByUserId[user.id] = 'unsubscribed';
            } catch (error) {
              console.warn(`[ContactsSubscription] Error unsubscribing:`, error);
            }
          }
          
          if (channel) {
            try {
              supabase.removeChannel(channel);
            } catch (error) {
              console.warn(`[ContactsSubscription] Error removing channel:`, error);
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
