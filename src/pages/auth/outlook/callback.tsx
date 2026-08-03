import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOutlookAppUser } from '@/hooks/useOutlookAppUser';
import { useToast } from '@/hooks/use-toast';

export default function OutlookCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeConnection } = useOutlookAppUser();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The gateway redirects back with the connection key.
        // Check multiple possible parameter names the gateway might use.
        const connectionKey =
          searchParams.get('connection_key') ||
          searchParams.get('key') ||
          searchParams.get('lovack') ||
          searchParams.get('token') ||
          searchParams.get('connectionKey');

        // Also check for any param value that looks like a lovack_* key
        let finalKey = connectionKey;
        if (!finalKey) {
          for (const [name, value] of searchParams.entries()) {
            if (value && value.startsWith('lovack_')) {
              finalKey = value;
              break;
            }
          }
        }

        // Check for error in callback
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        if (error) {
          setStatus('error');
          setErrorMsg(errorDescription || error);
          toast({
            title: 'Connection failed',
            description: errorDescription || error,
            variant: 'destructive',
          });
          return;
        }

        if (!finalKey) {
          setStatus('error');
          setErrorMsg('No connection key received');
          toast({
            title: 'Connection failed',
            description: 'No connection key was returned from Microsoft.',
            variant: 'destructive',
          });
          return;
        }

        const success = await storeConnection(finalKey);
        if (success) {
          setStatus('success');
          toast({
            title: 'Outlook connected',
            description: 'Your Microsoft account is now linked.',
          });

          // Redirect to the page that initiated the auth flow
          const redirectTo = localStorage.getItem('outlook-auth-redirect') || '/settings/integrations';
          localStorage.removeItem('outlook-auth-redirect');

          setTimeout(() => {
            navigate(redirectTo);
          }, 1500);
        } else {
          setStatus('error');
          setErrorMsg('Failed to store connection key');
        }
      } catch (err: any) {
        console.error('Outlook callback error:', err);
        setStatus('error');
        setErrorMsg(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Completing Microsoft connection...';
      case 'success':
        return 'Connection successful! Redirecting...';
      case 'error':
        return errorMsg || 'Connection failed. Please try again.';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Outlook Connection
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
          <p className={`mt-2 text-sm ${
            status === 'processing' ? 'text-blue-600' :
            status === 'success' ? 'text-green-600' :
            'text-red-600'
          }`}>
            {getStatusMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}
