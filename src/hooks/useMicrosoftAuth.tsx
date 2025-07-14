
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
    if (!user) {
      console.log('useMicrosoftAuth - No user, skipping token fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching Microsoft token for user:', user.id);
      setLoading(true);
      const { data, error } = await supabase
        .from('microsoft_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Microsoft token fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setToken(data);
        setIsAuthenticated(true);
        console.log('Microsoft authentication: AUTHENTICATED');
      } else {
        setToken(null);
        setIsAuthenticated(false);
        console.log('Microsoft authentication: NOT AUTHENTICATED - No token found');
      }
    } catch (error: any) {
      console.error('Error fetching Microsoft token:', error);
      setToken(null);
      setIsAuthenticated(false);
      toast({
        title: "Error fetching Microsoft authentication",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateAuth = async () => {
    console.log('Initiating Microsoft OAuth...');
    
    try {
      // First, let's check if we have the client ID configured
      const { data: configData, error: configError } = await supabase.functions.invoke('microsoft-auth', {
        body: { action: 'check_config' }
      });

      console.log('Config check result:', { configData, configError });

      if (configError) {
        console.error('Config check failed:', configError);
        toast({
          title: "Configuration Error",
          description: "Microsoft authentication is not properly configured. Please contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      if (!configData?.clientId) {
        console.error('No client ID found in configuration');
        toast({
          title: "Configuration Missing",
          description: "Microsoft Client ID is not configured. Please contact your administrator.",
          variant: "destructive",
        });
        return;
      }

      const clientId = configData.clientId;
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth/microsoft/callback`);
      const scope = encodeURIComponent('https://graph.microsoft.com/Tasks.ReadWrite https://graph.microsoft.com/Calendars.Read offline_access');
      const responseType = 'code';
      
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=${responseType}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `response_mode=query`;

      console.log('Redirecting to Microsoft OAuth:', authUrl);
      window.location.href = authUrl;

    } catch (error: any) {
      console.error('Error initiating Microsoft auth:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to start Microsoft authentication process.",
        variant: "destructive",
      });
    }
  };

  const handleAuthCallback = async (code: string) => {
    try {
      console.log('Handling Microsoft auth callback with code:', code);
      const { data, error } = await supabase.functions.invoke('microsoft-auth', {
        body: { code, user_id: user?.id }
      });

      console.log('Auth callback result:', { data, error });

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
      console.log('Disconnecting Microsoft account for user:', user.id);
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
    console.log('useMicrosoftAuth - User changed:', user?.id);
    fetchToken();
  }, [user]);

  // Check for auth callback on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && user) {
      console.log('Found auth callback code, processing...');
      handleAuthCallback(code);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  console.log('useMicrosoftAuth hook state:', {
    token: !!token,
    loading,
    isAuthenticated,
    userId: user?.id,
    hasUser: !!user
  });

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
