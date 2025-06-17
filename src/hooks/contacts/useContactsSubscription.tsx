
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Globals
let globalChannel: any = null;
let isSubscribed = false;
let subscribers: Set<() => void> = new Set();

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) return;

    const notify = () => {
      if (refetchRef.current) {
        refetchRef.current();
      }
    };

    subscribers.add(notify);

    // Setup channel once
    if (!globalChannel) {
      const channelName = `contacts-global-${user.id}`;
      console.log('Creating contacts channel:', channelName);
      globalChannel = supabase.channel(channelName);
    }

    // Subscribe once
    if (!isSubscribed && globalChannel) {
      console.log('Subscribing to contacts channel...');
      globalChannel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contacts',
          },
          () => {
            console.log('Contacts change detected, notifying subscribers');
            subscribers.forEach(fn => fn());
          }
        )
        .subscribe((status: string) => {
          console.log('Contacts subscription status:', status);
          if (status === 'SUBSCRIBED') isSubscribed = true;
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            globalChannel = null;
            isSubscribed = false;
          }
        });
    }

    // Cleanup
    return () => {
      subscribers.delete(notify);

      if (subscribers.size === 0 && globalChannel) {
        console.log('Cleaning up contacts subscription...');
        try {
          globalChannel.unsubscribe();
          supabase.removeChannel(globalChannel);
        } catch (e) {
          console.warn('Error cleaning up contacts channel:', e);
        }
        globalChannel = null;
        isSubscribed = false;
      }
    };
  }, [user?.id]);
}
