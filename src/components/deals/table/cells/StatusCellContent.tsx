
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { PipelineStageDropdown } from '../PipelineStageDropdown';
import { splitSectors } from '@/utils/sectorUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusCellContentProps {
  deal: Deal;
  type: 'pipeline_stage' | 'round_stage' | 'deal_source' | 'sector';
  onUpdate?: () => void;
}

const tagBadge = 'max-w-full truncate px-1.5 py-0 text-[11px] font-medium';

export function StatusCellContent({ deal, type, onUpdate }: StatusCellContentProps) {
  switch (type) {
    case 'pipeline_stage':
      return <PipelineStageDropdown deal={deal} onUpdate={onUpdate} />;

    case 'round_stage':
      return deal.round_stage ? (
        <Badge variant="outline" className={`${tagBadge} border-muted-foreground/30`}>
          {deal.round_stage}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'deal_source':
      return deal.deal_source ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={tagBadge}>
              {deal.deal_source}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <p className="whitespace-normal">{deal.deal_source}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'sector': {
      const sectors = splitSectors(deal.sector);
      if (sectors.length === 0) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block max-w-[200px] cursor-help truncate text-xs text-foreground">
              {sectors.join(' · ')}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-[300px]">
            <p className="whitespace-normal">{sectors.join(', ')}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
