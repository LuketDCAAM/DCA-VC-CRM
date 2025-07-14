
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function MicrosoftAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthCallback } = useMicrosoftAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      console.log('=== MICROSOFT CALLBACK PAGE ===');
      console.log('Full URL:', window.location.href);
      console.log('Search params:', window.location.search);
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      console.log('Auth code:', code ? 'Present' : 'Missing');
      console.log('Auth error:', error);
      console.log('Error description:', errorDescription);

      if (error) {
        console.error('Microsoft OAuth error:', error, errorDescription);
        setStatus('error');
        setErrorMessage(`${error}: ${errorDescription || 'Unknown error'}`);
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        setStatus('error');
        setErrorMessage('No authorization code received from Microsoft');
        return;
      }

      try {
        console.log('Processing auth callback...');
        await handleAuthCallback(code);
        setStatus('success');
        setTimeout(() => {
          navigate('/deals');
        }, 2000);
      } catch (error: any) {
        console.error('Error processing auth callback:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to complete authentication');
      }
    };

    processCallback();
  }, [searchParams, handleAuthCallback, navigate]);

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
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                There was an error connecting your Microsoft account.
              </p>
              {errorMessage && (
                <p className="text-xs text-muted-foreground bg-red-50 p-2 rounded">
                  {errorMessage}
                </p>
              )}
              <button 
                onClick={() => navigate('/deals')}
                className="text-sm text-blue-600 hover:underline"
              >
                Return to Deals
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
