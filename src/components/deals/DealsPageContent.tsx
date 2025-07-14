
import React, { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { DealsHeader } from './DealsHeader';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { DealsViewTabs } from './DealsViewTabs';
import { DealsViewRenderer, ViewMode } from './views/DealsViewRenderer';
import { generateDealsFilterOptions } from './filters/DealsFilterConfig';
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
  allDeals: Deal[];
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
  allDeals,
}: DealsPageContentProps) {
  console.log('DealsPageContent - showAdvancedFilters:', showAdvancedFilters);
  console.log('DealsPageContent - activeFilters:', activeFilters);
  console.log('DealsPageContent - allDeals for filter generation:', allDeals.length);

  // Generate dynamic filter options based on actual deals data
  const dynamicFilterOptions = useMemo(() => {
    console.log('Generating dynamic filter options...');
    return generateDealsFilterOptions(allDeals);
  }, [allDeals]);

  return (
    <div className="space-y-4">
      <DealsHeader 
        filteredDeals={filteredDeals}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onCSVImport={onCSVImport}
        onDealAdded={onDealAdded}
      />
      
      <div className="space-y-3">
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          placeholder="Search deals by company, contact, location, or description..."
          filters={dynamicFilterOptions}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={onToggleAdvanced}
        />
      </div>

      <DealsViewTabs 
        viewMode={viewMode} 
        onViewModeChange={onViewModeChange}
        dealCount={filteredDeals.length}
      />

      <DealsViewRenderer
        viewMode={viewMode}
        filteredDeals={filteredDeals}
        onViewDetails={onViewDetails}
        selectedDeals={selectedDeals}
        onToggleDealSelection={onToggleDealSelection}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        isAllSelected={isAllSelected}
        onDealUpdated={onDealUpdated}
      />
    </div>
  );
}
