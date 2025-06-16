
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Deal } from '@/types/deal';
import { DealCardHeader } from './card/DealCardHeader';
import { DealCardActions } from './card/DealCardActions';
import { DealCardContent } from './card/DealCardContent';
import { DealCardFinancials } from './card/DealCardFinancials';

interface DealCardProps {
  deal: Deal;
  onViewDetails?: (deal: Deal) => void;
  isSelected?: boolean;
  onToggleSelection?: (dealId: string) => void;
  showSelection?: boolean;
}

export function DealCard({ 
  deal, 
  onViewDetails, 
  isSelected = false, 
  onToggleSelection,
  showSelection = false 
}: DealCardProps) {
  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-primary ring-opacity-50 bg-primary/5' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <DealCardHeader
              deal={deal}
              showSelection={showSelection}
              isSelected={isSelected}
              onToggleSelection={onToggleSelection}
            />
          </div>
          <DealCardActions
            deal={deal}
            onViewDetails={onViewDetails}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <DealCardContent deal={deal} />
        <DealCardFinancials deal={deal} />
      </CardContent>
    </Card>
  );
}
