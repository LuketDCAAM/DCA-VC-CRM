import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, List, Trash2, Edit, Archive, Upload } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { DealCard } from '@/components/deals/DealCard';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { DealPipelineBoard } from '@/components/deals/DealPipelineBoard';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { ExportData } from '@/components/common/ExportData';
import { CSVImport } from '@/components/common/CSVImport';
import { useCSVImport } from '@/hooks/useCSVImport';

export default function Deals() {
  const { deals, loading, refetch } = useDeals();
  const { importDeals } = useCSVImport();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('board');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // CSV template columns for deals
  const csvTemplateColumns = [
    { key: 'company_name', label: 'Company Name', required: true },
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
  ];

  const handleCSVImport = async (data: any[]) => {
    const result = await importDeals(data);
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
      key: 'created_at',
      label: 'Date Added',
      value: 'created_at',
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
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'pipeline_stage', label: 'Pipeline Stage' },
    { key: 'round_stage', label: 'Round Stage' },
    { key: 'location', label: 'Location' },
    { key: 'website', label: 'Website' },
    { key: 'created_at', label: 'Date Added' },
  ];

  const filteredDeals = deals.filter(deal => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Active filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value || value === 'all' || value === '') return true;
      
      if (key === 'created_at') {
        const dealDate = new Date(deal.created_at).toISOString().split('T')[0];
        return dealDate >= value;
      }
      
      if (key === 'round_size_min') {
        return !deal.round_size || deal.round_size >= parseInt(value) * 100;
      }
      
      if (key === 'round_size_max') {
        return !deal.round_size || deal.round_size <= parseInt(value) * 100;
      }
      
      return deal[key as keyof typeof deal] === value;
    });

    return matchesSearch && matchesFilters;
  });

  const handleViewDetails = (deal) => {
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

  const activeDeals = deals.filter(deal => !['Invested', 'Passed'].includes(deal.pipeline_stage)).length;
  const investedDeals = deals.filter(deal => deal.pipeline_stage === 'Invested').length;
  const passedDeals = deals.filter(deal => deal.pipeline_stage === 'Passed').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Deal Flow</h1>
          <p className="text-gray-600">Manage your investment pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportData
            data={filteredDeals}
            filename="deals"
            columns={exportColumns}
            loading={loading}
          />
          <CSVImport
            title="Import Deals"
            description="Upload a CSV file to import multiple deals at once"
            templateColumns={csvTemplateColumns}
            onImport={handleCSVImport}
          >
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </CSVImport>
          <AddDealDialog onDealAdded={refetch}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </AddDealDialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{investedDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{passedDeals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        placeholder="Search deals by company, contact, or location..."
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedDeals}
        totalItems={filteredDeals.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        actions={bulkActions}
        onAction={handleBulkAction}
        isAllSelected={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
      />

      {/* View Toggle and Content */}
      <div className="mt-6">
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="board" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Pipeline Board
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <DealPipelineBoard deals={filteredDeals} onViewDetails={handleViewDetails} />
          </TabsContent>

          <TabsContent value="list">
            {filteredDeals.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Deals Found</CardTitle>
                  <CardDescription>
                    {deals.length === 0 
                      ? "You haven't added any deals yet."
                      : "No deals match your current filters."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      {deals.length === 0 
                        ? "Start by adding your first deal to track in your pipeline."
                        : "Try adjusting your search or filter criteria."
                      }
                    </p>
                    {deals.length === 0 && (
                      <AddDealDialog onDealAdded={refetch}>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add your first deal
                        </Button>
                      </AddDealDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeals.map((deal) => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Deal Detail Dialog */}
      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onDealUpdated={() => {
            refetch();
            setShowDetailDialog(false);
          }}
        />
      )}
    </div>
  );
}
