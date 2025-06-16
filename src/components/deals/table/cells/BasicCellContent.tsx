
import React from 'react';
import { MapPin } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '../tableUtils';

interface BasicCellContentProps {
  deal: Deal;
  type: 'location' | 'deal_lead' | 'created_at' | 'source_date' | 'description';
}

export function BasicCellContent({ deal, type }: BasicCellContentProps) {
  switch (type) {
    case 'location':
      return deal.location ? (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-foreground">{deal.location}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'deal_lead':
      return deal.deal_lead ? (
        <span className="text-sm text-foreground font-medium">{deal.deal_lead}</span>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'created_at':
      return (
        <div className="text-xs text-muted-foreground font-medium">
          {formatDate(deal.created_at)}
        </div>
      );

    case 'source_date':
      return deal.source_date ? (
        <div className="text-xs text-muted-foreground font-medium">
          {formatDate(deal.source_date)}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'description':
      return deal.description ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px] cursor-help">
              {deal.description}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <p className="whitespace-normal">{deal.description}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
