
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function MicrosoftAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useMicrosoftAuth();
  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<any>(null);

  const copyErrorToClipboard = () => {
    const errorInfo = {
      url: window.location.href,
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
    toast({
      title: "Error details copied",
      description: "Error information has been copied to your clipboard",
    });
  };

  const retryAuth = () => {
    setStatus('processing');
    setErrorMessage('');
    setErrorDetails(null);
    
    // Re-run the callback processing
    const code = searchParams.get('code');
    if (code && user) {
      handleAuthCallback(code).then(() => {
        setStatus('success');
        setTimeout(() => {
          navigate('/deals');
        }, 2000);
      }).catch((error) => {
        console.error('Retry error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Authentication failed');
        setErrorDetails(error);
      });
    }
  };

  useEffect(() => {
    const processCallback = async () => {
      console.log('=== MICROSOFT CALLBACK PAGE ===');
      console.log('Full URL:', window.location.href);
      console.log('Search params:', window.location.search);
      console.log('Auth state - user:', user);
      console.log('Auth state - userLoading:', userLoading);
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');
      
      console.log('Auth code:', code ? 'Present (length: ' + code.length + ')' : 'Missing');
      console.log('Auth error:', error);
      console.log('Error description:', errorDescription);
      console.log('State:', state);

      if (error) {
        console.error('Microsoft OAuth error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(`Microsoft OAuth Error: ${error}`);
        setErrorDetails({
          error,
          error_description: errorDescription,
          state,
          full_url: window.location.href
        });
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        setStatus('error');
        setErrorMessage('No authorization code received from Microsoft');
        setErrorDetails({
          message: 'The OAuth flow did not return an authorization code',
          search_params: window.location.search,
          full_url: window.location.href
        });
        return;
      }

      // Wait for user to load if it's still loading
      if (userLoading) {
        console.log('User still loading, waiting...');
        return;
      }

      if (!user) {
        console.error('No user found in auth state');
        setStatus('error');
        setErrorMessage('Please log in to your account first, then try connecting Microsoft again');
        setErrorDetails({
          message: 'User not authenticated',
          user_loading: userLoading,
          has_user: !!user
        });
        return;
      }

      try {
        console.log('Processing auth callback with user:', user.id);
        console.log('Authorization code length:', code.length);
        
        await handleAuthCallback(code);
        setStatus('success');
        
        toast({
          title: "Microsoft authentication successful",
          description: "Your Outlook integration is now active!",
        });
        
        setTimeout(() => {
          navigate('/deals');
        }, 2000);
      } catch (error: any) {
        console.error('Error processing auth callback:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
        
        setStatus('error');
        
        // Parse different types of errors with more specificity
        if (error.message?.includes('Microsoft token exchange failed')) {
          setErrorMessage('Microsoft rejected the authentication request. This could be due to an invalid redirect URI or expired authorization code.');
        } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
          setErrorMessage('Authentication service error. Please try again or contact support if the problem persists.');
        } else if (error.message?.includes('Network error')) {
          setErrorMessage('Network error occurred. Please check your connection and try again.');
        } else if (error.message?.includes('OAuth configuration')) {
          setErrorMessage('Microsoft OAuth is not properly configured. Please contact support.');
        } else {
          setErrorMessage(error.message || 'Failed to complete authentication');
        }
        
        setErrorDetails({
          error_type: 'callback_processing_error',
          error_message: error.message,
          error_stack: error.stack,
          user_id: user.id,
          code_length: code.length,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          raw_error: error
        });
      }
    };

    processCallback();
  }, [searchParams, handleAuthCallback, navigate, user, userLoading, toast]);

  // Show loading while waiting for user authentication to resolve
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Authentication
            </CardTitle>
            <CardDescription>
              Checking your login status...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            {status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
            Microsoft Authentication
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Processing your authentication...'}
            {status === 'success' && 'Authentication successful! Redirecting...'}
            {status === 'error' && 'Authentication failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'processing' && (
            <p className="text-sm text-muted-foreground">
              Please wait while we complete your Microsoft account connection.
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm text-green-600">
              Your Microsoft account has been successfully connected. You'll be redirected to the deals page shortly.
            </p>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-sm text-red-600">
                {errorMessage}
              </p>
              {errorDetails && (
                <div className="text-xs text-muted-foreground bg-red-50 p-3 rounded border max-h-32 overflow-y-auto">
                  <p className="font-medium text-red-800 mb-2">Error Details:</p>
                  <pre className="text-left whitespace-pre-wrap text-xs">{JSON.stringify(errorDetails, null, 2)}</pre>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  onClick={retryAuth}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Authentication
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyErrorToClipboard}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Error Details
                </Button>
                {errorMessage.includes('log in to your account first') && (
                  <Button 
                    onClick={() => navigate('/')}
                    size="sm"
                  >
                    Go to Login
                  </Button>
                )}
                <Button 
                  onClick={() => navigate('/deals')}
                  variant="outline"
                  size="sm"
                >
                  Return to Deals
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
