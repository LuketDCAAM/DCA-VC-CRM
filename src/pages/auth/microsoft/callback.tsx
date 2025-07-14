
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function MicrosoftAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setStatus('error');
          toast({
            title: "Authentication Error",
            description: errorDescription || error,
            variant: "destructive",
          });
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          setStatus('error');
          toast({
            title: "Authentication Error",
            description: "No authorization code received",
            variant: "destructive",
          });
          return;
        }

        console.log('Processing Microsoft auth callback with code:', code.substring(0, 20) + '...');

        // Exchange the authorization code for tokens
        const { data, error: functionError } = await supabase.functions.invoke('microsoft-auth', {
          body: { code }
        });

        if (functionError) {
          console.error('Function error:', functionError);
          setStatus('error');
          toast({
            title: "Authentication Error",
            description: functionError.message || "Failed to authenticate with Microsoft",
            variant: "destructive",
          });
          return;
        }

        if (!data || !data.access_token) {
          console.error('No access token received:', data);
          setStatus('error');
          toast({
            title: "Authentication Error",
            description: "Failed to receive access token",
            variant: "destructive",
          });
          return;
        }

        console.log('Microsoft authentication successful');
        setStatus('success');
        
        toast({
          title: "Success",
          description: "Microsoft account connected successfully",
        });

        // Redirect to the page that initiated the auth flow, or default to dashboard
        const redirectTo = localStorage.getItem('microsoft-auth-redirect') || '/dashboard';
        localStorage.removeItem('microsoft-auth-redirect');
        
        setTimeout(() => {
          navigate(redirectTo);
        }, 2000);

      } catch (error) {
        console.error('Error in Microsoft auth callback:', error);
        setStatus('error');
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Processing Microsoft authentication...';
      case 'success':
        return 'Authentication successful! Redirecting...';
      case 'error':
        return 'Authentication failed. Please try again.';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Microsoft Authentication
          </h2>
          <div className="mt-4 flex justify-center">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <div className="rounded-full h-8 w-8 bg-green-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-full h-8 w-8 bg-red-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            )}
          </div>
          <p className={`mt-2 text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}
