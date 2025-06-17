
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Cache of active channels by user ID
const channelsByUserId: Record<string, any> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) return;

    // Initialize subscriber set for this user
    if (!subscribersByUserId[user.id]) {
      subscribersByUserId[user.id] = new Set();
    }

    // Add current refetch to subscribers for this user
    const refetchFunction = () => {
      if (refetchRef.current) {
        refetchRef.current();
      }
    };
    subscribersByUserId[user.id].add(refetchFunction);

    // If channel for this user doesn't exist, create and subscribe
    if (!channelsByUserId[user.id]) {
      const channel = supabase.channel(`contacts-global-${user.id}`);

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contacts' },
          () => {
            subscribersByUserId[user.id].forEach(sub => sub());
          }
        )
        .subscribe((status) => {
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            delete channelsByUserId[user.id];
            delete subscribersByUserId[user.id];
          }
        });

      channelsByUserId[user.id] = channel;
    }

    return () => {
      subscribersByUserId[user.id].delete(refetchFunction);

      if (
        subscribersByUserId[user.id].size === 0 &&
        channelsByUserId[user.id]
      ) {
        channelsByUserId[user.id].unsubscribe();
        supabase.removeChannel(channelsByUserId[user.id]);
        delete channelsByUserId[user.id];
        delete subscribersByUserId[user.id];
      }
    };
  }, [user?.id]);
}
