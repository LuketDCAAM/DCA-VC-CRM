import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Manages the Microsoft Outlook connection via the Lovable connector gateway.
 * This replaces the old custom OAuth flow (microsoft-auth edge function + microsoft_tokens table).
 * Tokens are now stored encrypted in the connector gateway — only a connection key (lovack_*)
 * is stored locally in the outlook_connections table.
 */
export function useMicrosoftAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchToken = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('outlook-app-user', {
        body: { action: 'status' },
      });

      if (error) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!data?.connected);
      }
    } catch (error) {
      console.error('Error checking Outlook connection:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const initiateAuth = async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }

    try {
      // Save the return URL so we can redirect back after the callback
      const returnTo = window.location.pathname + window.location.search;
      localStorage.setItem('outlook-auth-redirect', returnTo);

      const returnUrl = `${window.location.origin}/auth/outlook/callback`;
      const { data, error } = await supabase.functions.invoke('outlook-app-user', {
        body: { action: 'authorize', return_url: returnUrl },
      });

      if (error || !data?.authorization_url) {
        throw new Error(error?.message || 'Failed to start authorization');
      }

      window.location.href = data.authorization_url;
    } catch (error: any) {
      console.error('Error initiating Outlook auth:', error);
      toast({
        title: 'Could not start connection',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAuthCallback = async (_code: string) => {
    // Legacy method — no longer used with the gateway flow.
    // The callback is now handled by /auth/outlook/callback.
    await fetchToken();
  };

  const disconnectMicrosoft = async () => {
    try {
      const { error } = await supabase.functions.invoke('outlook-app-user', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      setIsAuthenticated(false);
      toast({
        title: 'Microsoft account disconnected',
        description: 'Outlook sync has been disabled.',
      });
    } catch (error: any) {
      console.error('Error disconnecting Microsoft account:', error);
      toast({
        title: 'Error disconnecting account',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchToken();
  }, [user]);

  return {
    token: null, // Legacy — tokens are now in the gateway, not local
    loading,
    isAuthenticated,
    initiateAuth,
    handleAuthCallback,
    disconnectMicrosoft,
    refetch: fetchToken,
  };
}
