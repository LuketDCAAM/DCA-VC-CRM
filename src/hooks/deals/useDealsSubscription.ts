
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Cache channels and subscribers by user ID
const channelsByUserId: Record<string, any> = {};
const subscribersByUserId: Record<string, Set<() => void>> = {};

export function useDealsSubscription(userId: string | undefined, queryKey: (string | undefined)[]) {
  const queryClient = useQueryClient();
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!userId) return;

    // Ensure subscriber set exists
    if (!subscribersByUserId[userId]) {
      subscribersByUserId[userId] = new Set();
    }

    const invalidateFunction = () => {
      if (queryKeyRef.current) {
        console.log('Invalidating deals query...');
        queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
      }
    };

    // Add this hook's invalidation function
    subscribersByUserId[userId].add(invalidateFunction);

    // Only create Supabase channel once
    if (!channelsByUserId[userId]) {
      const channel = supabase.channel(`deals-global-${userId}`);

      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
