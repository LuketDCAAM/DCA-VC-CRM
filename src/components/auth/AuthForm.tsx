
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Check if user is coming from password reset email
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isResettingPassword) {
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        if (error) throw error;
        
        toast({
          title: "Password updated",
          description: "Your password has been successfully reset.",
        });
        setIsResettingPassword(false);
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        
        setResetEmailSent(true);
        toast({
          title: "Password reset email sent",
          description: "Check your email for a link to reset your password.",
        });
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name
            }
          }
        });
        if (error) throw error;
        
        setRegistrationSuccess(true);
        toast({
          title: "Registration successful",
          description: "Your account has been created and is pending approval. You'll be able to access the CRM once an administrator approves your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Password Reset Email Sent!</CardTitle>
            <CardDescription>
              Check your email for instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                We've sent a password reset link to {email}. Click the link in the email to create a new password.
              </p>
            </div>
            <Button
              onClick={() => {
                setResetEmailSent(false);
                setIsForgotPassword(false);
                setEmail('');
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Registration Successful!</CardTitle>
            <CardDescription>
              Your account has been created and is now pending approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                An administrator will review your registration and approve your access to the DCA VC CRM. 
                This usually takes 1-2 business days.
              </p>
            </div>
            <Button
              onClick={() => {
                setRegistrationSuccess(false);
                setIsSignUp(false);
                setEmail('');
                setPassword('');
                setName('');
              }}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isResettingPassword 
              ? 'Set New Password' 
              : isForgotPassword 
                ? 'Reset Password' 
                : isSignUp 
                  ? 'Create Account' 
                  : 'Sign In'
            }
          </CardTitle>
          <CardDescription>
            {isResettingPassword
              ? 'Enter your new password below'
              : isForgotPassword
                ? 'Enter your email to receive a password reset link'
                : isSignUp 
                  ? 'Create your account to request access to DCA VC CRM'
                  : 'Sign in to your DCA VC CRM account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isForgotPassword && !isResettingPassword && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}
            {!isResettingPassword && (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            {!isForgotPassword && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isResettingPassword ? "Enter new password" : ""}
                />
              </div>
            )}
            {isSignUp && !isForgotPassword && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> New accounts require administrator approval before accessing the CRM.
                </p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? 'Loading...' 
                : isResettingPassword
                  ? 'Update Password'
                  : isForgotPassword 
                    ? 'Send Reset Link' 
                    : isSignUp 
                      ? 'Request Access' 
                      : 'Sign In'
              }
            </Button>
          </form>
          {!isResettingPassword && (
            <div className="mt-4 space-y-2 text-center">
              {!isForgotPassword && !isSignUp && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-blue-600 hover:underline block w-full"
                >
                  Forgot password?
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsForgotPassword(false);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Request access"}
              </button>
              {isForgotPassword && (
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-sm text-blue-600 hover:underline block w-full"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
