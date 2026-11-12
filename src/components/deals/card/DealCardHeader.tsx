import { NameDetailsButton } from '@/components/common/NameDetailsButton';

import React from 'react';
import { CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2 } from 'lucide-react';
import { Deal } from '@/types/deal';
import { getStageColor } from './dealCardUtils';

interface DealCardHeaderProps {
  deal: Deal;
  onViewDetails?: (deal: Deal) => void;
  showSelection: boolean;
  isSelected: boolean;
  onToggleSelection?: (dealId: string) => void;
}

export function DealCardHeader({ 
  deal, 
  showSelection, 
  isSelected, 
  onToggleSelection,
  onViewDetails
}: DealCardHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {showSelection && onToggleSelection && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(deal.id)}
          className="mt-1"
          aria-label={`Select ${deal.company_name}`}
        />
      )}
      <div className="flex-1">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <NameDetailsButton onClick={() => onViewDetails?.(deal)} className="whitespace-normal break-words text-lg font-semibold">{deal.company_name}</NameDetailsButton>
        </CardTitle>
        <div className="flex gap-2 mt-2 flex-wrap">
          <Badge className={getStageColor(deal.pipeline_stage)}>
            {deal.pipeline_stage}
          </Badge>
          {deal.round_stage && (
            <Badge variant="outline">
              {deal.round_stage}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
