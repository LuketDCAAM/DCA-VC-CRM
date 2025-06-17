
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Global map to store channels keyed by userId
const channelsMap: Record<string, any> = {};
const subscribersMap: Record<string, Set<() => void>> = {};

// Helper to get or create a singleton channel per userId for 'contacts' table
function getOrCreateContactsChannel(userId: string) {
  if (!channelsMap[userId]) {
    const channel = supabase.channel(`contacts-global-${userId}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'contacts' },
      () => {
        // Notify all subscribers for this userId
        if (subscribersMap[userId]) {
          subscribersMap[userId].forEach((callback) => callback());
        }
      }
    );

    channelsMap[userId] = channel;
    subscribersMap[userId] = new Set();
  }
  return channelsMap[userId];
}

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const refetchRef = useRef(refetch);

  // Keep refetch updated
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const channel = getOrCreateContactsChannel(userId);

    // Add this component's refetch function to subscribers set
    const callback = () => {
      if (refetchRef.current) {
        refetchRef.current();
      }
    };
    subscribersMap[userId].add(callback);

    // Subscribe if not subscribed yet
    if (!channel.isSubscribed) {
      channel.subscribe((status: string) => {
        console.log(`Contacts subscription status for user ${userId}:`, status);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          delete channelsMap[userId];
          delete subscribersMap[userId];
        }
      });
      channel.isSubscribed = true;
    }

    return () => {
      // Remove this subscriber's callback
      subscribersMap[userId].delete(callback);

      // If no subscribers left, unsubscribe and clean up
      if (subscribersMap[userId].size === 0) {
        if (channel.isSubscribed) {
          channel.unsubscribe();
          channel.isSubscribed = false;
        }
        delete channelsMap[userId];
        delete subscribersMap[userId];
      }
    };
  }, [user?.id]);
}
