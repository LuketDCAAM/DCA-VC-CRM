
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MicrosoftToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

export function useMicrosoftAuth() {
  const [token, setToken] = useState<MicrosoftToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchToken = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('microsoft_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setToken(data);
        setIsAuthenticated(true);
      } else {
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('Error fetching Microsoft token:', error);
      toast({
        title: "Error fetching Microsoft authentication",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateAuth = () => {
    // Microsoft OAuth 2.0 authorization URL
    const clientId = 'your-app-client-id'; // This would be configured in environment
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/microsoft/callback`);
    const scope = encodeURIComponent('https://graph.microsoft.com/Tasks.ReadWrite offline_access');
    const responseType = 'code';
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=${responseType}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_mode=query`;

    window.location.href = authUrl;
  };

  const handleAuthCallback = async (code: string) => {
    try {
      // This would call an edge function to exchange the code for tokens
      const { data, error } = await supabase.functions.invoke('microsoft-auth', {
        body: { code, user_id: user?.id }
      });

      if (error) throw error;

      toast({
        title: "Microsoft authentication successful",
        description: "Your Outlook tasks will now sync with your reminders.",
      });

      fetchToken();
    } catch (error: any) {
      console.error('Error handling Microsoft auth callback:', error);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const disconnectMicrosoft = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('microsoft_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setToken(null);
      setIsAuthenticated(false);

      toast({
        title: "Microsoft account disconnected",
        description: "Outlook sync has been disabled.",
      });
    } catch (error: any) {
      console.error('Error disconnecting Microsoft account:', error);
      toast({
        title: "Error disconnecting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchToken();
  }, [user]);

  return {
    token,
    loading,
    isAuthenticated,
    initiateAuth,
    handleAuthCallback,
    disconnectMicrosoft,
    refetch: fetchToken,
  };
}
