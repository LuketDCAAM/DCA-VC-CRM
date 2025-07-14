
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, ExternalLink } from 'lucide-react';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

export function MicrosoftAuthSetup() {
  const { isAuthenticated, loading, initiateAuth, disconnectMicrosoft } = useMicrosoftAuth();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading Microsoft authentication status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Microsoft Outlook Integration
          {isAuthenticated && (
            <Badge variant="secondary" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect your Microsoft account to sync calendar events with your deals and enable Outlook task management.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">This integration allows you to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Sync calendar events to automatically update deal call dates</li>
                <li>Push reminders to Outlook as tasks</li>
                <li>Keep your deal pipeline in sync with your calendar</li>
              </ul>
            </div>
            <Button onClick={initiateAuth} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Microsoft Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              Your Microsoft account is connected and ready to use. You can now sync calendar events and push tasks to Outlook.
            </div>
            <Button variant="outline" onClick={disconnectMicrosoft} className="w-full">
              Disconnect Microsoft Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
