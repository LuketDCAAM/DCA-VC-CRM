
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Global subscription state to prevent multiple subscriptions
let globalChannel: any = null;
let subscribers: Set<() => void> = new Set();
let isSubscribed = false;

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef<() => void>();

  // Store the refetch function in ref so it can be called from subscription
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) {
      return;
    }

    // Add this instance's refetch function to subscribers
    const refetchFunction = () => {
      if (refetchRef.current) {
        refetchRef.current();
      }
    };
    subscribers.add(refetchFunction);

    // Set up global subscription only if it doesn't exist and hasn't been subscribed
    if (!globalChannel && !isSubscribed) {
      console.log('Setting up global contacts subscription');
      
      const channelName = `contacts-global-${user.id}`;
      globalChannel = supabase.channel(channelName);
      
      globalChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contacts'
          },
          () => {
            console.log('Contacts change detected, notifying subscribers');
            // Notify all subscribers to refetch
            subscribers.forEach(subscriber => subscriber());
          }
        )
        .subscribe((status: string) => {
          console.log('Contacts subscription status:', status);
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            globalChannel = null;
            isSubscribed = false;
          }
        });
    }

    // Cleanup function
    return () => {
      subscribers.delete(refetchFunction);
      
      // Only remove the global channel if no more subscribers
      if (subscribers.size === 0 && globalChannel) {
        console.log('Cleaning up global contacts subscription');
        globalChannel.unsubscribe();
        supabase.removeChannel(globalChannel);
        globalChannel = null;
        isSubscribed = false;
      }
    };
  }, [user?.id]);
}
