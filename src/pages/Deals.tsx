
import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, Edit, Archive, Trash2 } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { DealPipelineBoard } from '@/components/deals/DealPipelineBoard';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useAuth } from '@/hooks/useAuth';
import { Deal } from '@/types/deal';
import { DealsHeader } from '@/components/deals/DealsHeader';
import { DealsStats } from '@/components/deals/DealsStats';
import { useFilteredDeals } from '@/hooks/useFilteredDeals';
import { EnhancedDealListView } from '@/components/deals/EnhancedDealListView';
import { DealFilters } from '@/hooks/usePaginatedDeals';

export default function Deals() {
  const { deals, loading, refetch } = useDeals();
  const { importDeals } = useCSVImport();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('board');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // CSV template columns for deals
  const csvTemplateColumns = [
    { key: 'company_name', label: 'Company Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'contact_phone', label: 'Contact Phone' },
    { key: 'website', label: 'Website' },
    { key: 'location', label: 'Location' },
    { key: 'pipeline_stage', label: 'Pipeline Stage' },
    { key: 'round_stage', label: 'Round Stage' },
    { key: 'round_size', label: 'Round Size ($)' },
    { key: 'post_money_valuation', label: 'Post Money Valuation ($)' },
    { key: 'revenue', label: 'Revenue ($)' },
    { key: 'deal_score', label: 'Deal Score (0-100)' },
    { key: 'deal_lead', label: 'Deal Lead' },
    { key: 'deal_source', label: 'Deal Source' },
    { key: 'source_date', label: 'Source Date (YYYY-MM-DD)' },
  ];

  const handleCSVImport = async (data: any[]) => {
    if (!user) {
      return { success: false, error: 'You must be logged in to import deals.' };
    }

    const parseCurrency = (value: string | number | null) => {
      if (value === null || value === undefined || value === '') return null;
      const num = parseFloat(String(value).replace(/[^0-9.-]+/g,""));
      return isNaN(num) ? null : Math.round(num * 100);
    };

    const processedData = data
      .filter(row => row.company_name) // Ensure required field is present
      .map(row => ({
        company_name: row.company_name,
        description: row.description || null,
        contact_name: row.contact_name || null,
        contact_email: row.contact_email || null,
        contact_phone: row.contact_phone || null,
        website: row.website || null,
        location: row.location || null,
        pipeline_stage: row.pipeline_stage || 'Initial Contact',
        round_stage: row.round_stage || null,
        round_size: parseCurrency(row.round_size),
        post_money_valuation: parseCurrency(row.post_money_valuation),
        revenue: parseCurrency(row.revenue),
        deal_score: row.deal_score ? parseInt(String(row.deal_score).replace(/[^0-9]/g, ''), 10) : null,
        deal_lead: row.deal_lead || null,
        deal_source: row.deal_source || null,
        source_date: row.source_date || null,
        created_by: user.id,
      }));

    if (processedData.length === 0) {
      return { success: false, error: 'No valid deals to import. Make sure "Company Name" is provided for each row.' };
    }
      
    const result = await importDeals(processedData);
    if (result.success) {
      refetch();
    }
    return result;
  };

  // Filter options for deals
  const filterOptions: FilterOption[] = [
    {
      key: 'pipeline_stage',
      label: 'Pipeline Stage',
      value: 'pipeline_stage',
      type: 'select',
      options: [
        { label: 'Seen Not Reviewed', value: 'Seen Not Reviewed' },
        { label: 'Initial Review', value: 'Initial Review' },
        { label: 'Initial Contact', value: 'Initial Contact' },
        { label: 'First Meeting', value: 'First Meeting' },
        { label: 'Due Diligence', value: 'Due Diligence' },
        { label: 'Term Sheet', value: 'Term Sheet' },
        { label: 'Legal Review', value: 'Legal Review' },
        { label: 'Invested', value: 'Invested' },
        { label: 'Passed', value: 'Passed' },
      ]
    },
    {
      key: 'round_stage',
      label: 'Round Stage',
      value: 'round_stage',
      type: 'select',
      options: [
        { label: 'Pre-Seed', value: 'Pre-Seed' },
        { label: 'Seed', value: 'Seed' },
        { label: 'Series A', value: 'Series A' },
        { label: 'Series B', value: 'Series B' },
        { label: 'Series C', value: 'Series C' },
        { label: 'Growth', value: 'Growth' },
      ]
    },
    {
      key: 'location',
      label: 'Location',
      value: 'location',
      type: 'select',
      options: [
        { label: 'San Francisco', value: 'San Francisco' },
        { label: 'New York', value: 'New York' },
        { label: 'Los Angeles', value: 'Los Angeles' },
        { label: 'Austin', value: 'Austin' },
        { label: 'Remote', value: 'Remote' },
      ]
    },
    {
      key: 'round_size',
      label: 'Round Size',
      value: 'round_size',
      type: 'range'
    },
    {
      key: 'deal_score',
      label: 'Deal Score',
      value: 'deal_score',
      type: 'range',
    },
    {
      key: 'created_at',
      label: 'Date Added',
      value: 'created_at',
      type: 'date'
    },
    {
      key: 'deal_source',
      label: 'Deal Source',
      value: 'deal_source',
      type: 'select',
      options: [
        { label: 'Referral', value: 'Referral' },
        { label: 'Conference', value: 'Conference' },
        { label: 'Cold Outreach', value: 'Cold Outreach' },
        { label: 'Inbound', value: 'Inbound' },
        { label: 'Network', value: 'Network' },
      ]
    },
    {
      key: 'source_date',
      label: 'Source Date',
      value: 'source_date',
      type: 'date'
    }
  ];

  // Bulk actions for deals
  const bulkActions: BulkAction[] = [
    {
      id: 'move-to-stage',
      label: 'Move to Stage',
      icon: Edit,
      variant: 'default'
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'secondary'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true
    }
  ];

  // Export columns for deals
  const exportColumns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'description', label: 'Description' },
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'pipeline_stage', label: 'Pipeline Stage' },
    { key: 'round_stage', label: 'Round Stage' },
    { key: 'deal_score', label: 'Deal Score' },
    { key: 'location', label: 'Location' },
    { key: 'website', label: 'Website' },
    { key: 'created_at', label: 'Date Added' },
    { key: 'deal_lead', label: 'Deal Lead' },
    { key: 'deal_source', label: 'Deal Source' },
    { key: 'source_date', label: 'Source Date' },
  ];

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
        onCSVImport={handleCSVImport}
        onDealAdded={refetch}
      />

      <DealsStats
        totalDeals={deals.length}
        activeDeals={activeDeals}
        investedDeals={investedDeals}
        passedDeals={passedDeals}
      />

      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        placeholder="Search by company, contact, location, or description..."
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      <BulkActions
        selectedItems={selectedDeals}
        totalItems={filteredDeals.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        actions={bulkActions}
        onAction={handleBulkAction}
        isAllSelected={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
      />

      <div className="mt-6">
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Pipeline Board
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Enhanced List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <DealPipelineBoard deals={filteredDeals} onViewDetails={handleViewDetails} />
          </TabsContent>

          <TabsContent value="list">
            <EnhancedDealListView
              onViewDetails={handleViewDetails}
              onDealAdded={refetch}
              filters={dealFilters}
            />
          </TabsContent>
        </Tabs>
      </div>

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
