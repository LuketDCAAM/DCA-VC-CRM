
import React, { memo } from 'react';
import { DealCard } from './DealCard';
import { Deal } from '@/types/deal';

interface MemoizedDealCardProps {
  deal: Deal;
  onViewDetails?: (deal: Deal) => void;
  isSelected?: boolean;
  onToggleSelection?: (dealId: string) => void;
  showSelection?: boolean;
  onDealDeleted?: () => void;
}

const MemoizedDealCard = memo<MemoizedDealCardProps>(({ 
  deal, 
  onViewDetails, 
  isSelected = false, 
  onToggleSelection,
  showSelection = false,
  onDealDeleted
}) => {
  return (
    <DealCard
      deal={deal}
      onViewDetails={onViewDetails}
      isSelected={isSelected}
      onToggleSelection={onToggleSelection}
      showSelection={showSelection}
      onDealDeleted={onDealDeleted}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.deal.updated_at === nextProps.deal.updated_at &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.showSelection === nextProps.showSelection &&
    prevProps.deal.pipeline_stage === nextProps.deal.pipeline_stage &&
    prevProps.deal.company_name === nextProps.deal.company_name
  );
});

MemoizedDealCard.displayName = 'MemoizedDealCard';

export { MemoizedDealCard };
