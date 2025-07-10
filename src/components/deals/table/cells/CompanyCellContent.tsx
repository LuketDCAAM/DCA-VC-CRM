
import React from 'react';
import { Globe } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CompanyCellContentProps {
  deal: Deal;
}

export function CompanyCellContent({ deal }: CompanyCellContentProps) {
  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="space-y-1 py-1">
      <div className="font-semibold text-sm text-foreground leading-tight">{deal.company_name}</div>
      {deal.website && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={formatUrl(deal.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{deal.website}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <p>{deal.website}</p>
          </TooltipContent>
        </Tooltip>
      )}
      {deal.description && (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] cursor-help">
              {deal.description}
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-[300px]">
            <p className="whitespace-normal">{deal.description}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
