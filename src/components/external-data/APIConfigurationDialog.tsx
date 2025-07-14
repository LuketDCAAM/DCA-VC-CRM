
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExternalDataSync } from '@/hooks/useExternalDataSync';
import type { APIProvider } from '@/types/external-data';

interface APIConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const APIConfigurationDialog: React.FC<APIConfigurationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { apiConfigs, saveAPIConfig, isSavingConfig } = useExternalDataSync();
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>('crunchbase');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);
  const [isActive, setIsActive] = useState(true);

  const handleSave = () => {
    if (!apiKey) {
      return;
    }

    saveAPIConfig({
      provider: selectedProvider,
      api_key: apiKey,
      base_url: baseUrl || undefined,
      rate_limit_per_minute: rateLimitPerMinute,
      is_active: isActive,
    });

    // Reset form
    setApiKey('');
    setBaseUrl('');
    setRateLimitPerMinute(60);
    setIsActive(true);
  };

  const getProviderDefaults = (provider: APIProvider) => {
    switch (provider) {
      case 'crunchbase':
        return { baseUrl: 'https://api.crunchbase.com/api/v4' };
      case 'linkedin':
        return { baseUrl: 'https://api.linkedin.com/v2' };
      case 'apollo':
        return { baseUrl: 'https://api.apollo.io/v1' };
      case 'clearbit':
        return { baseUrl: 'https://company.clearbit.com/v2' };
      default:
        return { baseUrl: '' };
    }
  };

  const handleProviderChange = (provider: APIProvider) => {
    setSelectedProvider(provider);
    const defaults = getProviderDefaults(provider);
    setBaseUrl(defaults.baseUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Configurations */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Configurations</h3>
            <div className="grid gap-3">
              {apiConfigs?.map((config) => (
                <Card key={config.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm capitalize">{config.provider}</CardTitle>
                    <CardDescription>
                      {config.is_active ? 'Active' : 'Inactive'} • Rate limit: {config.rate_limit_per_minute}/min
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
              {(!apiConfigs || apiConfigs.length === 0) && (
                <p className="text-muted-foreground text-sm">No API configurations found</p>
              )}
            </div>
          </div>

          {/* Add New Configuration */}
          <div>
            <h3 className="text-lg font-medium mb-3">Add New Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">API Provider</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crunchbase">Crunchbase</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="apollo">Apollo.io</SelectItem>
                    <SelectItem value="clearbit">Clearbit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <Label htmlFor="baseUrl">Base URL (Optional)</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="API base URL"
                />
              </div>

              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={rateLimitPerMinute}
                  onChange={(e) => setRateLimitPerMinute(parseInt(e.target.value) || 60)}
                  min={1}
                  max={1000}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <Button
                onClick={handleSave}
                disabled={!apiKey || isSavingConfig}
                className="w-full"
              >
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
