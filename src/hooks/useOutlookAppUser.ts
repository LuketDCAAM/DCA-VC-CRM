import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useOutlookAppUser() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkStatus = useCallback(async () => {
    if (!user) {
      setConnected(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('outlook-app-user', {
        body: { action: 'status' },
      });

      if (error) {
        console.error('Error checking Outlook connection status:', error);
        setConnected(false);
      } else {
        setConnected(!!data?.connected);
      }
    } catch (err) {
      console.error('Failed to check Outlook status:', err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const initiateAuth = useCallback(async () => {
    if (!user) {
      toast({ title: 'Please sign in first', variant: 'destructive' });
      return;
    }

    setConnecting(true);
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

      // Redirect the user to the Microsoft consent screen
      window.location.href = data.authorization_url;
    } catch (err: any) {
      console.error('Failed to initiate Outlook auth:', err);
      toast({
        title: 'Could not start connection',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  }, [user, toast]);

  const storeConnection = useCallback(async (connectionKey: string) => {
    try {
      const { error } = await supabase.functions.invoke('outlook-app-user', {
        body: { action: 'store', connection_key: connectionKey },
      });

      if (error) throw error;

      setConnected(true);
      return true;
    } catch (err: any) {
      console.error('Failed to store Outlook connection:', err);
      toast({
        title: 'Connection failed',
        description: err.message || 'Could not save your connection.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('outlook-app-user', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      setConnected(false);
      toast({ title: 'Outlook disconnected' });
    } catch (err: any) {
      console.error('Failed to disconnect Outlook:', err);
      toast({
        title: 'Failed to disconnect',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const proxy = useCallback(async (path: string, method: string = 'GET', apiBody?: any) => {
    const { data, error } = await supabase.functions.invoke('outlook-app-user', {
      body: { action: 'proxy', path, method, body: apiBody },
    });

    if (error) throw error;
    return data;
  }, []);

  return {
    connected,
    loading,
    connecting,
    initiateAuth,
    storeConnection,
    disconnect,
    checkStatus,
    proxy,
  };
}
