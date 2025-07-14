
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, RefreshCw, Clock } from 'lucide-react';
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
  const { isAuthenticated } = useMicrosoftAuth();

  if (!isAuthenticated) {
    return null;
  }

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
          <p>Sync Outlook calendar events to update deal call dates</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
