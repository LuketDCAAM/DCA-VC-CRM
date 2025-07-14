
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { getPipelineStageColor, getPipelineStageClasses } from '../../pipelineStageColors';
import { PipelineStageDropdown } from '../PipelineStageDropdown';

interface StatusCellContentProps {
  deal: Deal;
  type: 'pipeline_stage' | 'round_stage' | 'deal_source' | 'sector';
  onUpdate?: () => void;
}

export function StatusCellContent({ deal, type, onUpdate }: StatusCellContentProps) {
  switch (type) {
    case 'pipeline_stage':
      return (
        <PipelineStageDropdown 
          deal={deal} 
          onUpdate={onUpdate}
        />
      );

    case 'round_stage':
      return deal.round_stage ? (
        <Badge variant="outline" className="font-medium text-xs px-2.5 py-1 border-muted-foreground/30">
          {deal.round_stage}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'deal_source':
      return deal.deal_source ? (
        <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
          {deal.deal_source}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'sector':
      return deal.sector ? (
        <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 border-muted-foreground/30">
          {deal.sector}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
