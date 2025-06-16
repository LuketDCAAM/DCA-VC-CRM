
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { getPipelineStageColor } from '../tableUtils';

interface StatusCellContentProps {
  deal: Deal;
  type: 'pipeline_stage' | 'round_stage' | 'deal_source' | 'sector';
}

export function StatusCellContent({ deal, type }: StatusCellContentProps) {
  switch (type) {
    case 'pipeline_stage':
      return (
        <Badge className={`text-xs font-medium px-2.5 py-1 ${getPipelineStageColor(deal.pipeline_stage)}`}>
          {deal.pipeline_stage}
        </Badge>
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
