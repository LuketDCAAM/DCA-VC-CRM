
import React from 'react';
import { useOptimizedDeals } from '@/hooks/useOptimizedDeals';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useOptimizedFilteredDeals } from '@/hooks/useOptimizedFilteredDeals';
import { DealsPageContent } from '@/components/deals/DealsPageContent';
import { useDealsPageState } from '@/hooks/useDealsPageState';
import { useDealsCSVConfig } from '@/components/deals/DealsCSVConfig';

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

  console.log('=== DEALS PAGE RENDER ===');
  console.log('Deals page - dealStats from hook:', dealStats);
  console.log('Deals page - total deals array length:', deals.length);
  console.log('Deals page - loading state:', loading);

  const handleCSVImportWrapper = async (data: any[]) => {
    console.log('CSV Import wrapper called with', data.length, 'rows');
    
    const processResult = await handleCSVImport(data);
    console.log('Process result:', processResult);
    
    if (!processResult.success) {
      return {
        success: false,
        error: processResult.error,
        errors: processResult.errors
      };
    }
    
    const result = await importDeals(processResult.data);
    console.log('Import result:', result);
    
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
      <div className="p-6">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
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
          onOpenChange={setShowDetailDialog}
          onDealUpdated={() => {
            refetch();
            setShowDetailDialog(false);
            setSelectedDeal(null);
          }}
        />
      )}
    </div>
  );
}
