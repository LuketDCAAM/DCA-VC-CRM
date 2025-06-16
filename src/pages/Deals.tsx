
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
  const { deals, loading, refetch } = useDeals();
  const { importDeals } = useCSVImport();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // Changed from 'board' to 'list'
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const { csvTemplateColumns, exportColumns, handleCSVImport } = useDealsCSVConfig();

  const handleCSVImportWrapper = async (data: any[]) => {
    console.log('CSV Import wrapper called with', data.length, 'rows');
    
    // Process the data through our configuration
    const processResult = await handleCSVImport(data);
    console.log('Process result:', processResult);
    
    if (!processResult.success) {
      return {
        success: false,
        error: processResult.error,
        errors: processResult.errors
      };
    }
    
    // Import the processed data
    const result = await importDeals(processResult.data);
    console.log('Import result:', result);
    
    if (result.success) {
      // Refresh the deals list after successful import
      await refetch();
    }
    
    return {
      success: result.success,
      imported: result.imported,
      errors: result.errors || processResult.errors
    };
  };

  const filteredDeals = useFilteredDeals(deals, searchTerm, activeFilters);

  // Convert activeFilters to DealFilters format for the paginated hook
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

  const handleViewDetails = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDetailDialog(true);
  };

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

  const handleBulkAction = (actionId: string, selectedIds: string[]) => {
    console.log(`Bulk action ${actionId} on deals:`, selectedIds);
    // TODO: Implement actual bulk actions
    setSelectedDeals([]);
  };

  const handleSelectAll = () => {
    setSelectedDeals(filteredDeals.map(deal => deal.id));
  };

  const handleDeselectAll = () => {
    setSelectedDeals([]);
  };

  const activeDeals = useMemo(() => deals.filter(deal => !['Invested', 'Passed'].includes(deal.pipeline_stage)).length, [deals]);
  const investedDeals = useMemo(() => deals.filter(deal => deal.pipeline_stage === 'Invested').length, [deals]);
  const passedDeals = useMemo(() => deals.filter(deal => deal.pipeline_stage === 'Passed').length, [deals]);

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
        totalDeals={deals.length}
        activeDeals={activeDeals}
        investedDeals={investedDeals}
        passedDeals={passedDeals}
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
        onToggleDealSelection={(dealId) => {
          setSelectedDeals(prev => 
            prev.includes(dealId) 
              ? prev.filter(id => id !== dealId)
              : [...prev, dealId]
          );
        }}
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
