
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Global subscription management
const globalSubscriptions: Record<string, {
  channel: any;
  subscribers: Set<() => void>;
  isSubscribed: boolean;
  isSubscribing: boolean;
}> = {};

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) return;

    console.log(`[ContactsSubscription] Setting up subscription for user: ${user.id}`);

    const userId = user.id;
    
    // Create refetch function for this instance
    const refetchFunction = () => {
      if (refetchRef.current) {
        console.log(`[ContactsSubscription] Triggering refetch for user: ${userId}`);
        refetchRef.current();
      }
    };

    // Initialize or get existing subscription
    if (!globalSubscriptions[userId]) {
      globalSubscriptions[userId] = {
        channel: null,
        subscribers: new Set(),
        isSubscribed: false,
        isSubscribing: false,
      };
    }

    const subscription = globalSubscriptions[userId];
    subscription.subscribers.add(refetchFunction);

    // Only create subscription if not already subscribed or subscribing
    if (!subscription.isSubscribed && !subscription.isSubscribing) {
      console.log(`[ContactsSubscription] Creating new subscription for user: ${userId}`);
      
      subscription.isSubscribing = true;
      
      // Create a unique channel name to avoid conflicts
      const channelName = `contacts-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase.channel(channelName);
      
      subscription.channel = channel;
      
      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contacts' },
          (payload) => {
            console.log(`[ContactsSubscription] Received change for user ${userId}:`, payload);
            // Notify all subscribers
            subscription.subscribers.forEach(subscriber => {
              try {
                subscriber();
              } catch (error) {
                console.error(`[ContactsSubscription] Error in subscriber callback:`, error);
              }
            });
          }
        )
        .subscribe((status) => {
          console.log(`[ContactsSubscription] Subscription status for user ${userId}:`, status);
          
          if (status === 'SUBSCRIBED') {
            subscription.isSubscribed = true;
            subscription.isSubscribing = false;
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            console.warn(`[ContactsSubscription] Subscription failed for user ${userId}:`, status);
            // Clean up on error
            subscription.isSubscribed = false;
            subscription.isSubscribing = false;
            if (subscription.channel) {
              try {
                supabase.removeChannel(subscription.channel);
              } catch (error) {
                console.warn(`[ContactsSubscription] Error removing channel:`, error);
              }
              subscription.channel = null;
            }
          }
        });
    } else if (subscription.isSubscribed) {
      console.log(`[ContactsSubscription] Reusing existing subscription for user: ${userId}`);
    } else {
      console.log(`[ContactsSubscription] Waiting for subscription to complete for user: ${userId}`);
    }

    return () => {
      console.log(`[ContactsSubscription] Cleanup for user: ${userId}`);
      
      if (subscription.subscribers.has(refetchFunction)) {
        subscription.subscribers.delete(refetchFunction);
      }

      // Only cleanup if no more subscribers
      if (subscription.subscribers.size === 0) {
        console.log(`[ContactsSubscription] No more subscribers, cleaning up for user: ${userId}`);
        
        if (subscription.channel) {
          try {
            subscription.channel.unsubscribe();
            supabase.removeChannel(subscription.channel);
          } catch (error) {
            console.warn(`[ContactsSubscription] Error during cleanup:`, error);
          }
        }
        
        delete globalSubscriptions[userId];
      }
    };
  }, [user?.id]);
}
