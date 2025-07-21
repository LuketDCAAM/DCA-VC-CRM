
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  const channelRef = useRef<any>(null);
  
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.warn('Error removing existing channel:', error);
      }
      channelRef.current = null;
    }

    // Create a unique channel name to avoid conflicts
    const channelName = `deals-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    const handleUpdate = () => {
      console.log('Invalidating deals query...');
      if (queryKeyRef.current) {
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `created_by=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime payload:', payload);
          handleUpdate();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Supabase channel error');
        }
      });

    return () => {
      // Cleanly remove the channel on unmount
      console.log('Unsubscribing deals channel...');
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.warn('Error removing deals channel:', error);
        }
        channelRef.current = null;
      }
    };
  }, [userId, queryClient]);

  return null;
}
