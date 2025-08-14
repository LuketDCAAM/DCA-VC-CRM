
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    if (!userId) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        // Silently handle cleanup errors
      }
      channelRef.current = null;
    }

    // Create new subscription
    const channel = supabase.channel(`deals_${userId}_${Date.now()}`);
    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
        },
        (payload) => {
          console.log('🔄 Deals subscription triggered:', payload);
          console.log('📋 Query key for invalidation:', queryKey);
          console.log('🔄 Invalidating queries with key:', queryKey);
          try {
            queryClient.invalidateQueries({ queryKey });
            console.log('✅ Successfully invalidated queries');
          } catch (error) {
            console.error('❌ Error invalidating queries:', error);
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
  }, [userId, queryClient, queryKey]);

  return null;
}
