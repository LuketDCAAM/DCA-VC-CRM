
import React from 'react';
import { Deal } from '@/types/deal';
import { DealsGrid } from '../DealsGrid';
import { DealPipelineBoard } from '../DealPipelineBoard';
import { ConfigurableDealsTable } from '../ConfigurableDealsTable';

export type ViewMode = 'grid' | 'configurable' | 'pipeline';

interface DealsViewRendererProps {
  viewMode: ViewMode;
  filteredDeals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  onDealUpdated: () => void;
}

export function DealsViewRenderer({
  viewMode,
  filteredDeals,
  onViewDetails,
  selectedDeals,
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onDealUpdated,
}: DealsViewRendererProps) {
  console.log('🎯 DEALS VIEW RENDERER:', {
    viewMode,
    totalDeals: filteredDeals.length,
    selectedDeals: selectedDeals.length,
  });

  const commonProps = {
    deals: filteredDeals,
    onViewDetails,
    selectedDeals,
    onToggleDealSelection,
    onSelectAll,
    onDeselectAll,
    isAllSelected,
  };

  switch (viewMode) {
    case 'configurable':
      return <ConfigurableDealsTable {...commonProps} />;
    case 'grid':
      return <DealsGrid {...commonProps} onDealUpdated={onDealUpdated} />;
    case 'pipeline':
      return (
        <DealPipelineBoard
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          onDealUpdated={onDealUpdated}
        />
      );
    default:
      return <ConfigurableDealsTable {...commonProps} />;
  }
}
