
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, RefreshCw, Settings } from 'lucide-react';
import { useOutlookCalendarSync } from '@/hooks/useOutlookCalendarSync';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

interface OutlookCalendarSyncButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showLabel?: boolean;
}

export function OutlookCalendarSyncButton({ 
  variant = 'outline', 
  size = 'default',
  showLabel = true 
}: OutlookCalendarSyncButtonProps) {
  const { syncCalendarEvents, syncing } = useOutlookCalendarSync();
  const { isAuthenticated, loading: authLoading, initiateAuth } = useMicrosoftAuth();

  console.log('OutlookCalendarSyncButton - Auth state:', { 
    isAuthenticated, 
    authLoading, 
    syncing 
  });

  // Show setup button if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={initiateAuth}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {showLabel && 'Setup Outlook'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connect Microsoft account to sync calendar events</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show loading state
  if (authLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4 animate-spin" />
        {showLabel && 'Loading...'}
      </Button>
    );
  }

  // Show sync button if authenticated
  const handleSync = () => {
    syncCalendarEvents();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {showLabel && (syncing ? 'Syncing...' : 'Sync Calendar')}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isAuthenticated 
              ? 'Sync Outlook calendar events to update deal and investor call dates'
              : 'Connect Microsoft account first'
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
