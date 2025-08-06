
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useContactsSubscription(user: User | null, refetch: () => void) {
  const channelRef = useRef<any>(null);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!user) return;

    // Clean up any existing subscription
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        // Silently handle cleanup errors
      }
      channelRef.current = null;
    }

    // Create new subscription
    const channel = supabase.channel(`contacts_${user.id}_${Date.now()}`);
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          try {
            refetchRef.current();
          } catch (error) {
            // Silently handle refetch errors
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          // Silently handle cleanup errors
        }
        channelRef.current = null;
      }
    };
  }, [user?.id]);
}
