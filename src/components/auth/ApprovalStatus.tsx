
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Clock, CheckCircle, XCircle, LogOut } from 'lucide-react';

export function ApprovalStatus() {
  const { approvalStatus, isPending, isRejected, loading } = useUserRoles();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isPending && <Clock className="h-12 w-12 text-orange-500" />}
            {isRejected && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle>
            {isPending && 'Account Pending Approval'}
            {isRejected && 'Account Access Denied'}
          </CardTitle>
          <CardDescription>
            {isPending && 'Your account is being reviewed by an administrator.'}
            {isRejected && 'Your account registration has been rejected.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant={isPending ? "secondary" : "destructive"}>
              Status: {approvalStatus}
            </Badge>
          </div>
          
          {isPending && (
            <p className="text-sm text-gray-600 text-center">
              You will receive access to the DCA VC CRM once an administrator approves your account. 
              This usually takes 1-2 business days.
            </p>
          )}
          
          {isRejected && (
            <p className="text-sm text-gray-600 text-center">
              If you believe this is an error, please contact your administrator at{' '}
              <a href="mailto:luke.turner@dcaam.com" className="text-blue-600 hover:underline">
                luke.turner@dcaam.com
              </a>
            </p>
          )}

          <Button onClick={handleSignOut} variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
