
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      console.log('Cleaning up existing deals channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `deals-channel-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Setting up deals subscription:', channelName);
    
    const dealsChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          console.log('=== DEALS REALTIME UPDATE ===');
          console.log('Event:', payload.eventType);
          console.log('Table:', payload.table);
          console.log('Payload:', payload);
          console.log('Invalidating deals query...');
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe((status) => {
        console.log('Deals subscription status:', status);
      });

    channelRef.current = dealsChannel;

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up deals subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, queryClient, queryKey]);

  return channelRef;
}
