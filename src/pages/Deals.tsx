
import React, { useState, useMemo } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { useCSVImport } from '@/hooks/useCSVImport';
import { Deal } from '@/types/deal';
import { DealsHeader } from '@/components/deals/DealsHeader';
import { DealsStats } from '@/components/deals/DealsStats';
import { useFilteredDeals } from '@/hooks/useFilteredDeals';
import { DealFilters } from '@/hooks/usePaginatedDeals';
import { DealsFilters } from '@/components/deals/DealsFilters';
import { DealsBulkActions } from '@/components/deals/DealsBulkActions';
import { DealsViewTabs } from '@/components/deals/DealsViewTabs';
import { useDealsCSVConfig } from '@/components/deals/DealsCSVConfig';

export default function Deals() {
  const { deals, loading, refetch, dealStats } = useDeals();
  const { importDeals } = useCSVImport();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  console.log('=== DEALS PAGE RENDER ===');
  console.log('Deals page - dealStats from hook:', dealStats);
  console.log('Deals page - total deals array length:', deals.length);
  console.log('Deals page - loading state:', loading);

  const { csvTemplateColumns, exportColumns, handleCSVImport } = useDealsCSVConfig();

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

  // Optimized filtered deals with memoization
  const filteredDeals = useFilteredDeals(deals, searchTerm, activeFilters);

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

  // Memoized event handlers to prevent unnecessary re-renders
  const handleViewDetails = useMemo(() => (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDetailDialog(true);
  }, []);

  const handleFilterChange = useMemo(() => (key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleClearFilters = useMemo(() => () => {
    setActiveFilters({});
    setSearchTerm('');
  }, []);

  const handleBulkAction = useMemo(() => (actionId: string, selectedIds: string[]) => {
    console.log(`Bulk action ${actionId} on deals:`, selectedIds);
    setSelectedDeals([]);
  }, []);

  const handleSelectAll = useMemo(() => () => {
    setSelectedDeals(filteredDeals.map(deal => deal.id));
  }, [filteredDeals]);

  const handleDeselectAll = useMemo(() => () => {
    setSelectedDeals([]);
  }, []);

  const handleDealUpdated = useMemo(() => () => {
    refetch();
  }, [refetch]);

  // Memoized toggle deal selection to prevent unnecessary re-renders
  const handleToggleDealSelection = useMemo(() => (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <DealsHeader
        filteredDeals={filteredDeals}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onCSVImport={handleCSVImportWrapper}
        onDealAdded={refetch}
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
        onSearchChange={setSearchTerm}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      <DealsBulkActions
        selectedDeals={selectedDeals}
        totalDeals={filteredDeals.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkAction={handleBulkAction}
        isAllSelected={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
      />

      <DealsViewTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filteredDeals={filteredDeals}
        onViewDetails={handleViewDetails}
        onDealAdded={refetch}
        dealFilters={dealFilters}
        selectedDeals={selectedDeals}
        onToggleDealSelection={handleToggleDealSelection}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        isAllSelected={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
        onBulkAction={handleBulkAction}
        onDealUpdated={handleDealUpdated}
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
