
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Settings } from 'lucide-react';
import { useExternalDataSync } from '@/hooks/useExternalDataSync';
import { APIConfigurationDialog } from './APIConfigurationDialog';
import type { APIProvider } from '@/types/external-data';
import type { Deal } from '@/types/deal';

interface ExternalDataSyncButtonProps {
  deal: Deal;
  size?: 'sm' | 'default';
}

export const ExternalDataSyncButton: React.FC<ExternalDataSyncButtonProps> = ({
  deal,
  size = 'default',
}) => {
  const { apiConfigs, syncDealData, isSyncing } = useExternalDataSync();
  const [showConfig, setShowConfig] = useState(false);

  const availableProviders: APIProvider[] = ['crunchbase', 'linkedin', 'apollo', 'clearbit'];
  const configuredProviders = apiConfigs?.map(config => config.provider as APIProvider) || [];
  const unconfiguredProviders = availableProviders.filter(p => !configuredProviders.includes(p));

  const handleSyncAll = () => {
    if (configuredProviders.length > 0) {
      syncDealData({ dealId: deal.id, providers: configuredProviders });
    }
  };

  const handleSyncProvider = (provider: APIProvider) => {
    syncDealData({ dealId: deal.id, providers: [provider] });
  };

  const getSyncStatus = () => {
    if (!deal.external_data_sync_status) return 'pending';
    return deal.external_data_sync_status;
  };

  const getStatusBadge = () => {
    const status = getSyncStatus();
    const variants = {
      pending: 'secondary',
      success: 'default',
      failed: 'destructive',
      partial: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {status}
      </Badge>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={size}
            disabled={isSyncing}
            className="gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Sync Data
            {getSyncStatus() !== 'pending' && getStatusBadge()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {configuredProviders.length > 0 && (
            <>
              <DropdownMenuItem onClick={handleSyncAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All Providers
              </DropdownMenuItem>
              {configuredProviders.map((provider) => (
                <DropdownMenuItem
                  key={provider}
                  onClick={() => handleSyncProvider(provider)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Sync {provider}
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {unconfiguredProviders.length > 0 && (
            <DropdownMenuItem onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure APIs
            </DropdownMenuItem>
          )}
          
          {configuredProviders.length === 0 && (
            <DropdownMenuItem onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Setup API Keys
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <APIConfigurationDialog
        open={showConfig}
        onOpenChange={setShowConfig}
      />
    </>
  );
};
