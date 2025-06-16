
import React from 'react';
import { Globe } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CompanyCellContentProps {
  deal: Deal;
}

export function CompanyCellContent({ deal }: CompanyCellContentProps) {
  return (
    <div className="space-y-1 py-1">
      <div className="font-semibold text-sm text-foreground leading-tight">{deal.company_name}</div>
      {deal.website && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{deal.website}</span>
            </div>
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
