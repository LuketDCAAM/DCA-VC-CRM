
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckCircle, XCircle, RefreshCw, Link, Unlink } from 'lucide-react';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useOutlookSync } from '@/hooks/useOutlookSync';
import { format } from 'date-fns';

interface OutlookIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutlookIntegrationDialog({ open, onOpenChange }: OutlookIntegrationDialogProps) {
  const { isAuthenticated, loading, initiateAuth, disconnectMicrosoft } = useMicrosoftAuth();
  const { syncing, syncLogs, syncFromOutlook, fullSync, fetchSyncLogs } = useOutlookSync();

  React.useEffect(() => {
    if (open) {
      fetchSyncLogs();
    }
  }, [open, fetchSyncLogs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getSyncTypeLabel = (type: string) => {
    switch (type) {
      case 'full':
        return 'Full Sync';
      case 'incremental':
        return 'Incremental';
      case 'push':
        return 'Push to Outlook';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Microsoft Outlook Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Checking authentication status...</span>
                </div>
              ) : isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Connected to Microsoft Outlook</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your reminders can now sync with Microsoft Outlook tasks.
                  </p>
                  <Button
                    variant="outline"
                    onClick={disconnectMicrosoft}
                    className="flex items-center gap-2"
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Not connected</span>
                    <Badge variant="destructive">Disconnected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect your Microsoft account to sync reminders with Outlook tasks.
                  </p>
                  <Button
                    onClick={initiateAuth}
                    className="flex items-center gap-2"
                  >
                    <Link className="h-4 w-4" />
                    Connect to Microsoft
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Controls */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sync Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage synchronization between your reminders and Outlook tasks.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={syncFromOutlook}
                      disabled={syncing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {syncing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Sync from Outlook
                    </Button>
                    <Button
                      onClick={fullSync}
                      disabled={syncing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {syncing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Full Sync
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sync History */}
          {isAuthenticated && syncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="font-medium">{getSyncTypeLabel(log.sync_type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(log.started_at), 'MMM d, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {log.status === 'completed' && (
                          <div className="text-sm text-muted-foreground">
                            {log.items_processed} items processed
                          </div>
                        )}
                        {log.status === 'failed' && log.error_message && (
                          <div className="text-sm text-red-500 max-w-48 truncate">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
