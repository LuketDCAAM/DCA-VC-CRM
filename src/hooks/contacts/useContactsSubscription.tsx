
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Global state
let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let subscribers: Set<() => void> = new Set();
let hasSubscribed = false;

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) return;

    // Wrap the refetch so we can call it later
    const notify = () => {
      if (refetchRef.current) {
        refetchRef.current();
      }
    };

    subscribers.add(notify);

    // If there's no channel, create one
    if (!globalChannel) {
      const channelName = `contacts-global-${user.id}`;
      console.log('Creating new channel:', channelName);
      globalChannel = supabase.channel(channelName);
    }

    // Only subscribe once
    if (globalChannel && !hasSubscribed) {
      hasSubscribed = true;

      globalChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contacts',
          },
          () => {
            console.log('Contacts change received. Notifying all subscribers...');
            subscribers.forEach((fn) => fn());
          }
        )
        .subscribe((status: string) => {
          console.log('Contacts channel status:', status);
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            globalChannel = null;
            hasSubscribed = false;
          }
        });
    }

    // Clean up this hook's subscription
    return () => {
      subscribers.delete(notify);

      // If no more components are listening, clean up the whole channel
      if (subscribers.size === 0 && globalChannel) {
        console.log('Unsubscribing from global contacts channel...');
        globalChannel
          .unsubscribe()
          .then(() => {
            if (globalChannel) supabase.removeChannel(globalChannel);
          })
          .catch((err) => console.warn('Error unsubscribing:', err));

        globalChannel = null;
        hasSubscribed = false;
      }
    };
  }, [user?.id]);
}
