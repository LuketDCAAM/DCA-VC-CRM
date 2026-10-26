
import React, { lazy, memo, Suspense } from 'react';
import { Deal } from '@/types/deal';
import { ConfigurableDealsTable } from '../ConfigurableDealsTable';

const HighPerformanceDealsTableView = lazy(() => import('../HighPerformanceDealsTableView').then(module => ({ default: module.HighPerformanceDealsTableView })));
const DealsGrid = lazy(() => import('../DealsGrid').then(module => ({ default: module.DealsGrid })));
const DealPipelineBoard = lazy(() => import('../DealPipelineBoard').then(module => ({ default: module.DealPipelineBoard })));

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

const DealsViewContent = memo(function DealsViewContent({
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
});

export function DealsViewRenderer(props: DealsViewRendererProps) {
  return (
    <Suspense fallback={<div className="py-6 text-sm text-muted-foreground">Loading deals view...</div>}>
      <DealsViewContent {...props} />
    </Suspense>
  );
}
