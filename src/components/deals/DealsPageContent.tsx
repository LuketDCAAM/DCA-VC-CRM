
import React, { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { DealFilters } from '@/hooks/usePaginatedDeals';
import { DealsHeader } from './DealsHeader';
import { DealsStats } from './DealsStats';
import { DealsFilters } from './DealsFilters';
import { DealsBulkActions } from './DealsBulkActions';
import { DealsViewTabs } from './DealsViewTabs';
import { DealStats } from '@/hooks/deals/dealStatsCalculator';

interface DealsPageContentProps {
  filteredDeals: Deal[];
  dealStats: DealStats;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  showAdvancedFilters: boolean;
  onToggleAdvanced: () => void;
  selectedDeals: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (actionId: string, selectedIds: string[]) => void;
  isAllSelected: boolean;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  onViewDetails: (deal: Deal) => void;
  onToggleDealSelection: (dealId: string) => void;
  onDealAdded: () => void;
  onDealUpdated: () => void;
  csvTemplateColumns: { key: string; label: string; required?: boolean }[];
  exportColumns: { key: string; label: string }[];
  onCSVImport: (data: any[]) => Promise<{ success: boolean; error?: string }>;
}

export function DealsPageContent({
  filteredDeals,
  dealStats,
  loading,
  searchTerm,
  onSearchChange,
  activeFilters,
  onFilterChange,
  onClearFilters,
  showAdvancedFilters,
  onToggleAdvanced,
  selectedDeals,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
  isAllSelected,
  viewMode,
  onViewModeChange,
  onViewDetails,
  onToggleDealSelection,
  onDealAdded,
  onDealUpdated,
  csvTemplateColumns,
  exportColumns,
  onCSVImport,
}: DealsPageContentProps) {
  // Memoized deal filters to prevent unnecessary recalculations
  const dealFilters: DealFilters = useMemo(() => {
    const filters: DealFilters = {};
    
    if (searchTerm) filters.searchTerm = searchTerm;
    if (activeFilters.pipeline_stage) filters.pipeline_stage = activeFilters.pipeline_stage;
    if (activeFilters.round_stage) filters.round_stage = activeFilters.round_stage;
    if (activeFilters.location) filters.location = activeFilters.location;
    if (activeFilters.deal_source) filters.deal_source = activeFilters.deal_source;
    
    if (activeFilters.round_size?.min !== undefined) filters.round_size_min = activeFilters.round_size.min;
    if (activeFilters.round_size?.max !== undefined) filters.round_size_max = activeFilters.round_size.max;
    if (activeFilters.deal_score?.min !== undefined) filters.deal_score_min = activeFilters.deal_score.min;
    if (activeFilters.deal_score?.max !== undefined) filters.deal_score_max = activeFilters.deal_score.max;
    
    if (activeFilters.created_at?.from) filters.created_at_from = activeFilters.created_at.from;
    if (activeFilters.created_at?.to) filters.created_at_to = activeFilters.created_at.to;
    if (activeFilters.source_date?.from) filters.source_date_from = activeFilters.source_date.from;
    if (activeFilters.source_date?.to) filters.source_date_to = activeFilters.source_date.to;
    
    return filters;
  }, [searchTerm, activeFilters]);

  return (
    <>
      <DealsHeader
        filteredDeals={filteredDeals}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onCSVImport={onCSVImport}
        onDealAdded={onDealAdded}
      />

      <DealsStats
        totalDeals={dealStats.totalDeals}
        activeDeals={dealStats.activeDeals}
        investedDeals={dealStats.investedDeals}
        passedDeals={dealStats.passedDeals}
        screeningDeals={dealStats.screeningDeals}
      />

      <DealsFilters
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        activeFilters={activeFilters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvanced={onToggleAdvanced}
      />

      <DealsBulkActions
        selectedDeals={selectedDeals}
        totalDeals={filteredDeals.length}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onBulkAction={onBulkAction}
        isAllSelected={isAllSelected}
      />

      <DealsViewTabs
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        filteredDeals={filteredDeals}
        onViewDetails={onViewDetails}
        onDealAdded={onDealAdded}
        dealFilters={dealFilters}
        selectedDeals={selectedDeals}
        onToggleDealSelection={onToggleDealSelection}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        isAllSelected={isAllSelected}
        onBulkAction={onBulkAction}
        onDealUpdated={onDealUpdated}
      />
    </>
  );
}
