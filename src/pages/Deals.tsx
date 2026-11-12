
import React, { lazy, Suspense, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptimizedDeals } from '@/hooks/useOptimizedDeals';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useOptimizedFilteredDeals } from '@/hooks/useOptimizedFilteredDeals';
import { DealsPageContent } from '@/components/deals/DealsPageContent';
import { useDealsPageState } from '@/hooks/useDealsPageState';
import { useDealsCSVConfig } from '@/components/deals/DealsCSVConfig';
import { useDebouncedSearch } from '@/hooks/useDebounce';

const DealDetailDialog = lazy(() => import('@/components/deals/DealDetailDialog').then(module => ({ default: module.DealDetailDialog })));

export default function Deals() {
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dealId = params.get('deal');
    const deal = deals.find(item => item.id === dealId);
    if (!deal) return;
    handleViewDetails(deal);
    params.delete('deal');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  }, [deals, location.search, location.pathname, handleViewDetails, navigate]);


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

  // Debounce search term so we don't re-filter 10k deals on every keystroke
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, 250);
  const filteredDeals = useOptimizedFilteredDeals(deals, debouncedSearchTerm, activeFilters);

  const isAllSelected = selectedDeals.length === filteredDeals.length && filteredDeals.length > 0;
  const selectAllFiltered = useMemo(() => handleSelectAll(filteredDeals), [handleSelectAll, filteredDeals]);

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
        onSelectAll={selectAllFiltered}
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
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
}
