
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useOutlookSync } from '@/hooks/useOutlookSync';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

interface OutlookSyncButtonProps {
  reminderId: string;
  syncStatus?: string | null;
  outlookTaskId?: string | null;
}

export function OutlookSyncButton({ reminderId, syncStatus, outlookTaskId }: OutlookSyncButtonProps) {
  const { pushToOutlook } = useOutlookSync();
  const { isAuthenticated } = useMicrosoftAuth();

  if (!isAuthenticated) {
    return null;
  }

  const handlePushToOutlook = () => {
    pushToOutlook(reminderId);
  };

  const getIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTooltipText = () => {
    if (outlookTaskId) {
      switch (syncStatus) {
        case 'synced':
          return 'Synced with Outlook';
        case 'failed':
          return 'Sync failed - click to retry';
        case 'pending':
          return 'Sync in progress';
        default:
          return 'Connected to Outlook task';
      }
    }
    return 'Push to Outlook';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePushToOutlook}
            className="h-8 px-2"
          >
            {getIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
