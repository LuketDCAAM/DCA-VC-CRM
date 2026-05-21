
import React from 'react';
import { useOptimizedDeals } from '@/hooks/useOptimizedDeals';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useOptimizedFilteredDeals } from '@/hooks/useOptimizedFilteredDeals';
import { DealsPageContent } from '@/components/deals/DealsPageContent';
import { useDealsPageState } from '@/hooks/useDealsPageState';
import { useDealsCSVConfig } from '@/components/deals/DealsCSVConfig';
import { useDebouncedSearch } from '@/hooks/useDebounce';

export default function Deals() {
  const { deals, loading, refetch, dealStats } = useOptimizedDeals();
  const { importDeals } = useCSVImport();
  const { csvTemplateColumns, exportColumns, handleCSVImport } = useDealsCSVConfig();

  const {
    searchTerm,
    selectedDeal,
    showDetailDialog,
    viewMode,
    selectedDeals,
    showAdvancedFilters,
    activeFilters,
    setSearchTerm,
    setSelectedDeal,
    setShowDetailDialog,
    setViewMode,
    setShowAdvancedFilters,
    handleViewDetails,
    handleFilterChange,
    handleClearFilters,
    handleToggleDealSelection,
    handleSelectAll,
    handleDeselectAll,
    handleBulkAction,
  } = useDealsPageState();


  const handleCSVImportWrapper = async (data: any[]) => {
    const processResult = await handleCSVImport(data);

    if (!processResult.success) {
      return {
        success: false,
        error: processResult.error,
        errors: processResult.errors
      };
    }

    const result = await importDeals(processResult.data);
    
    if (result.success) {
      await refetch();
    }
    
    return {
      success: result.success,
      imported: result.imported,
      errors: result.errors || processResult.errors
    };
  };

  // Use optimized filtered deals hook
  const filteredDeals = useOptimizedFilteredDeals(deals, searchTerm, activeFilters);

  const isAllSelected = selectedDeals.length === filteredDeals.length && filteredDeals.length > 0;

  if (loading) {
    return (
      <div className="px-6 pt-3 pb-6">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-3 pb-6">
      <DealsPageContent
        filteredDeals={filteredDeals}
        dealStats={dealStats}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        selectedDeals={selectedDeals}
        onSelectAll={handleSelectAll(filteredDeals)}
        onDeselectAll={handleDeselectAll}
        onBulkAction={handleBulkAction}
        isAllSelected={isAllSelected}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onViewDetails={handleViewDetails}
        onToggleDealSelection={handleToggleDealSelection}
        onDealAdded={refetch}
        onDealUpdated={refetch}
        csvTemplateColumns={csvTemplateColumns}
        exportColumns={exportColumns}
        onCSVImport={handleCSVImportWrapper}
        allDeals={deals}
      />

      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          open={showDetailDialog}
          onOpenChange={(open) => {
            setShowDetailDialog(open);
            if (!open) {
              setSelectedDeal(null);
            }
          }}
          onDealUpdated={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
