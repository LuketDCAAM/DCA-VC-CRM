
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Building2, MapPin, Users, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { Deal } from '@/types/deal';
import { ExternalDataSyncButton } from '@/components/external-data/ExternalDataSyncButton';

interface DealExternalDataCardProps {
  deal: Deal;
}

export function DealExternalDataCard({ deal }: DealExternalDataCardProps) {
  const hasExternalData = deal.linkedin_url || deal.crunchbase_url || deal.total_funding_raised || deal.founded_year;
  
  const getSyncStatusBadge = () => {
    if (!deal.external_data_sync_status) return null;
    
    const variants = {
      success: 'default',
      failed: 'destructive',
      partial: 'secondary',
      pending: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[deal.external_data_sync_status as keyof typeof variants] || 'secondary'} className="text-xs">
        {deal.external_data_sync_status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            External Data
          </CardTitle>
          <div className="flex items-center gap-2">
            {getSyncStatusBadge()}
            <ExternalDataSyncButton deal={deal} size="sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasExternalData && !deal.external_data_last_synced ? (
          <div className="text-center py-6">
            <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No external data synced yet</p>
            <p className="text-xs text-muted-foreground">Use the sync button to fetch data from external sources</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Company Links */}
            {(deal.linkedin_url || deal.crunchbase_url) && (
              <div>
                <div className="text-sm font-medium mb-2">Company Links</div>
                <div className="flex gap-2 flex-wrap">
                  {deal.linkedin_url && (
                    <a
                      href={deal.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                  {deal.crunchbase_url && (
                    <a
                      href={deal.crunchbase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Crunchbase
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Company Details */}
            <div className="grid grid-cols-2 gap-4">
              {deal.founded_year && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Founded</div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {deal.founded_year}
                  </div>
                </div>
              )}
              
              {deal.employee_count_range && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Employees</div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {deal.employee_count_range}
                  </div>
                </div>
              )}
              
              {deal.headquarters_location && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Headquarters</div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {deal.headquarters_location}
                  </div>
                </div>
              )}
              
              {deal.total_funding_raised && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Funding</div>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(deal.total_funding_raised / 100)}
                  </div>
                </div>
              )}
            </div>

            {/* Last Sync Info */}
            {deal.external_data_last_synced && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  Last synced: {new Date(deal.external_data_last_synced).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
