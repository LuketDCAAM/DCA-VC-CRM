
import React from 'react';
import { Deal } from '@/types/deal';
import { ConfigurableDealsTable } from '../ConfigurableDealsTable';
import { HighPerformanceDealsTableView } from '../HighPerformanceDealsTableView';
import { DealsGrid } from '../DealsGrid';
import { DealPipelineBoard } from '../DealPipelineBoard';

export type ViewMode = 'configurable' | 'high-performance' | 'virtualized' | 'kanban';

interface DealsViewRendererProps {
  viewMode: ViewMode;
  filteredDeals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  onDealUpdated?: () => void;
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
  switch (viewMode) {
    case 'configurable':
      return (
        <ConfigurableDealsTable
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          selectedDeals={selectedDeals}
          onToggleDealSelection={onToggleDealSelection}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          isAllSelected={isAllSelected}
          onDealUpdated={onDealUpdated}
        />
      );

    case 'high-performance':
      return (
        <HighPerformanceDealsTableView
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          selectedDeals={selectedDeals}
          onToggleDealSelection={onToggleDealSelection}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          isAllSelected={isAllSelected}
        />
      );

    case 'virtualized':
      return (
        <DealsGrid
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          selectedDeals={selectedDeals}
          onToggleDealSelection={onToggleDealSelection}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          isAllSelected={isAllSelected}
          onDealUpdated={onDealUpdated}
        />
      );

    case 'kanban':
      return (
        <DealPipelineBoard
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          onDealUpdated={onDealUpdated}
        />
      );

    default:
      return null;
  }
}
