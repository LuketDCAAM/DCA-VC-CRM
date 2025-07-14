
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useExternalDataSync } from '@/hooks/useExternalDataSync';

export const ExternalDataDashboard: React.FC = () => {
  const { apiConfigs, syncLogs, configsLoading, logsLoading } = useExternalDataSync();

  if (configsLoading || logsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const recentLogs = syncLogs?.slice(0, 10) || [];
  const successfulSyncs = syncLogs?.filter(log => log.status === 'success').length || 0;
  const failedSyncs = syncLogs?.filter(log => log.status === 'failed').length || 0;
  const totalSyncs = syncLogs?.length || 0;
  const successRate = totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 0;

  const configuredProviders = apiConfigs?.filter(config => config.is_active).length || 0;
  const totalProviders = 4; // crunchbase, linkedin, apollo, clearbit

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configured APIs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configuredProviders}/{totalProviders}</div>
            <p className="text-xs text-muted-foreground">
              {configuredProviders === totalProviders ? 'All configured' : `${totalProviders - configuredProviders} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSyncs}</div>
            <p className="text-xs text-muted-foreground">
              All time sync attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulSyncs} successful, {failedSyncs} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentLogs.length > 0 ? (
                new Date(recentLogs[0].started_at).toLocaleDateString()
              ) : (
                'None'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Last sync attempt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['crunchbase', 'linkedin', 'apollo', 'clearbit'].map((provider) => {
              const config = apiConfigs?.find(c => c.provider === provider);
              const isConfigured = config && config.is_active;
              
              return (
                <div key={provider} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="font-medium capitalize">{provider}</span>
                  <Badge variant={isConfigured ? 'default' : 'secondary'}>
                    {isConfigured ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No sync activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={log.status === 'success' ? 'default' : 
                              log.status === 'failed' ? 'destructive' : 'secondary'}
                      className="min-w-[70px] justify-center"
                    >
                      {log.status}
                    </Badge>
                    <div>
                      <div className="font-medium">{log.api_provider}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.sync_type} • {log.records_processed} processed • {log.records_updated} updated
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{new Date(log.started_at).toLocaleString()}</div>
                    {log.error_message && (
                      <div className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Error occurred
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
