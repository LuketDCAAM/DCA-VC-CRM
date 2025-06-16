
import React, { useState } from 'react';
import { Deal } from '@/types/deal';
import { DealsHeader } from './DealsHeader';
import { DealsStats } from './DealsStats';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { DealsFilters } from './DealsFilters';
import { DealsViewTabs } from './DealsViewTabs';
import { DealListView } from './DealListView';
import { DealsGrid } from './DealsGrid';
import { DealPipelineBoard } from './DealPipelineBoard';
import { ConfigurableDealsTable } from './ConfigurableDealsTable';
import { HighPerformanceDealsTableView } from './HighPerformanceDealsTableView';
import { VirtualizedDealsTable } from './VirtualizedDealsTable';
import { DealStats } from '@/hooks/deals/dealStatsCalculator';

export type ViewMode = 'list' | 'grid' | 'table' | 'pipeline' | 'configurable' | 'high-performance' | 'virtualized';

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
  onBulkAction: (action: string, dealIds: string[]) => Promise<void>;
  isAllSelected: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onViewDetails: (deal: Deal) => void;
  onToggleDealSelection: (dealId: string) => void;
  onDealAdded: () => void;
  onDealUpdated: () => void;
  csvTemplateColumns: any[];
  exportColumns: any[];
  onCSVImport: (data: any[]) => Promise<any>;
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
  const renderView = () => {
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
      case 'high-performance':
        return <HighPerformanceDealsTableView {...commonProps} />;
      case 'virtualized':
        return <VirtualizedDealsTable {...commonProps} height={600} />;
      case 'list':
        return <DealListView {...commonProps} onDealUpdated={onDealUpdated} />;
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
  };

  return (
    <div className="space-y-6">
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
      
      <div className="space-y-4">
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          placeholder="Search deals by company, contact, location, or description..."
        />
        
        {showAdvancedFilters && (
          <DealsFilters
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
          />
        )}
      </div>

      <DealsViewTabs 
        viewMode={viewMode} 
        onViewModeChange={onViewModeChange}
        dealCount={filteredDeals.length}
      />

      {renderView()}
    </div>
  );
}
