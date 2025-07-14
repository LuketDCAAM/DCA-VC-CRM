
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { useExternalDataSync } from '@/hooks/useExternalDataSync';
import type { Deal } from '@/types/deal';

interface ExternalDataSyncStatusProps {
  deal: Deal;
}

export const ExternalDataSyncStatus: React.FC<ExternalDataSyncStatusProps> = ({ deal }) => {
  const { syncLogs, isLoading } = useExternalDataSync();

  // Filter logs for this specific deal
  const dealSyncLogs = syncLogs?.filter(log => log.deal_id === deal.id) || [];
  const recentLogs = dealSyncLogs.slice(0, 5); // Show last 5 sync attempts

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sync Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sync attempts yet</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  {getStatusIcon(log.status)}
                  <div>
                    <div className="text-sm font-medium">{log.api_provider}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.started_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                    {log.status}
                  </Badge>
                  {log.records_processed > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {log.records_updated}/{log.records_processed}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {deal.external_data_last_synced && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Last successful sync: {new Date(deal.external_data_last_synced).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
