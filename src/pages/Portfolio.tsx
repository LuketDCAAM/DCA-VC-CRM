import React, { useState } from 'react';
import { Edit, Archive, Trash2 } from 'lucide-react';
import { usePortfolioCompanies, PortfolioCompany } from '@/hooks/usePortfolioCompanies';
import { PortfolioDetailDialog } from '@/components/portfolio/PortfolioDetailDialog';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { useDeletePortfolioCompany } from '@/hooks/useDeletePortfolioCompany';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePortfolioPositions, VEHICLES, POSITION_STATUSES } from '@/hooks/portfolio/usePortfolioPositions';
import { usePortfolioRollups } from '@/hooks/portfolio/usePortfolioRollups';
import { PortfolioKpiTiles } from '@/components/portfolio/PortfolioKpiTiles';
import { RollupTable } from '@/components/portfolio/RollupTable';
import { PositionsTable } from '@/components/portfolio/PositionsTable';
import { FinancialComparisonTable } from '@/components/portfolio/FinancialComparisonTable';
import { useAllPortcoQuarters } from '@/hooks/portfolio/useAllPortcoQuarters';
import { useAllPortcoRounds } from '@/hooks/portfolio/usePortcoRounds';
import { PortfolioTrendsTab } from '@/components/portfolio/PortfolioTrendsTab';
import { QuarterlyImportDialog } from '@/components/portfolio/QuarterlyImportDialog';
import { PositionsImportDialog } from '@/components/portfolio/PositionsImportDialog';
import { RoundsImportDialog } from '@/components/portfolio/RoundsImportDialog';

import { PositionEditDialog } from '@/components/portfolio/PositionEditDialog';
import type { EnrichedPosition } from '@/hooks/portfolio/usePortfolioRollups';



export default function Portfolio() {
  const { companies, loading, refetch } = usePortfolioCompanies();
  const { importPortfolioCompanies } = useCSVImport();
  const { deleteCompanies } = useDeletePortfolioCompany();
  const { byCompany, loading: positionsLoading, saving: positionSaving, savePosition } = usePortfolioPositions();
  const { byCompany: quartersByCompany, periods } = useAllPortcoQuarters();
  const { byCompany: roundsByCompany } = useAllPortcoRounds();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<PortfolioCompany | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [editingPosition, setEditingPosition] = useState<EnrichedPosition | null>(null);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);



  const handleSyncInvestedDeals = async () => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to sync deals.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Syncing...', description: 'Fetching invested deals to sync with portfolio.' });

    try {
      const { data: investedDeals, error: dealsError } = await supabase
        .from('deals')
        .select('company_name, description, relationship_owner, created_by')
        .eq('pipeline_stage', 'Invested')
        .eq('created_by', user.id);

      if (dealsError) throw dealsError;

      if (!investedDeals || investedDeals.length === 0) {
        toast({ title: 'Nothing to sync', description: 'All invested deals are already in your portfolio.' });
        return;
      }

      const companiesToUpsert = investedDeals.map(deal => ({
        company_name: deal.company_name,
        description: deal.description,
        relationship_owner: deal.relationship_owner,
        created_by: deal.created_by,
        status: 'Active' as const,
      }));

      const { error: upsertError } = await supabase
        .from('portfolio_companies')
        .upsert(companiesToUpsert, { onConflict: 'company_name, created_by' });

      if (upsertError) throw upsertError;

      toast({ title: 'Sync Complete', description: `${companiesToUpsert.length} companies synced successfully.` });
      await refetch();

    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // CSV template columns for portfolio companies
  const csvTemplateColumns = [
    { key: 'company_name', label: 'Company Name', required: true },
    { key: 'status', label: 'Status' },
    { key: 'tags', label: 'Tags (separated by ;)' },
    { key: 'relationship_owner', label: 'Relationship Owner' },
  ];

  const handleCSVImport = async (data: any[]) => {
    const result = await importPortfolioCompanies(data);
    if (result.success) {
      refetch();
    }
    return result;
  };

  // Filter options for portfolio companies
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      value: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Exited', value: 'Exited' },
        { label: 'Dissolved', value: 'Dissolved' },
      ]
    },
    {
      key: 'investment_amount',
      label: 'Investment Amount',
      value: 'investment_amount',
      type: 'range'
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      value: 'vehicle',
      type: 'select',
      options: VEHICLES.map((v) => ({ label: v, value: v })),
    },
    {
      key: 'position_status',
      label: 'Position Status',
      value: 'position_status',
      type: 'select',
      options: POSITION_STATUSES.map((s) => ({ label: s, value: s })),
    },
    {
      key: 'created_at',
      label: 'Date Added',
      value: 'created_at',
      type: 'date'
    }
  ];


  // Bulk actions for portfolio companies
  const bulkActions: BulkAction[] = [
    {
      id: 'update-status',
      label: 'Update Status',
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

  // Export columns for portfolio companies
  const exportColumns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'status', label: 'Status' },
    { key: 'total_invested', label: 'Total Invested' },
    { key: 'investment_count', label: 'Number of Investments' },
    { key: 'created_at', label: 'Date Added' },
    { key: 'updated_at', label: 'Last Updated' },
  ];

  const filteredCompanies = companies.filter(company => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Active filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value || value === 'all' || value === '') return true;
      
      if (key === 'created_at') {
        const companyDate = new Date(company.created_at).toISOString().split('T')[0];
        return companyDate >= value;
      }
      
      if (key === 'investment_amount_min') {
        const totalInvested = company.investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
        return totalInvested >= parseInt(value) * 100;
      }
      
      if (key === 'investment_amount_max') {
        const totalInvested = company.investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
        return totalInvested <= parseInt(value) * 100;
      }

      if (key === 'vehicle') {
        return byCompany.get(company.id)?.vehicle === value;
      }

      if (key === 'position_status') {
        return byCompany.get(company.id)?.position_status === value;
      }

      return company[key as keyof typeof company] === value;
    });

    return matchesSearch && matchesFilters;
  });

  const rollups = usePortfolioRollups(filteredCompanies, byCompany);


  const handleViewDetails = (company: PortfolioCompany) => {
    setSelectedCompany(company);
    setDetailDialogOpen(true);
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

  const handleBulkAction = async (actionId: string, selectedIds: string[]) => {
    if (actionId === 'delete') {
      const success = await deleteCompanies(selectedIds);
      if (success) await refetch();
    }
    setSelectedCompanies([]);
  };


  const handleSelectAll = () => {
    setSelectedCompanies(filteredCompanies.map(company => company.id));
  };

  const handleDeselectAll = () => {
    setSelectedCompanies([]);
  };

  // Prepare export data with calculated fields
  const exportData = filteredCompanies.map(company => ({
    ...company,
    total_invested: company.investments.reduce((sum, inv) => sum + inv.amount_invested, 0) / 100,
    investment_count: company.investments.length,
  }));

  if (loading || positionsLoading) {
    return (
      <div className="px-6 pt-3 pb-6">
        <div className="text-center">Loading portfolio companies...</div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-3 pb-6">
      <PortfolioHeader
        exportData={exportData}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onImport={handleCSVImport}
        onSync={handleSyncInvestedDeals}
        onSuccess={refetch}
      />

      <PortfolioKpiTiles totals={rollups.totals} activeCount={rollups.activeCount} />

      <SearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        placeholder="Search companies..."
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      <Tabs defaultValue="positions" className="mt-4">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="rollups">Roll-ups</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>


        <TabsContent value="positions" className="mt-4 space-y-3">
          <div className="flex flex-wrap justify-end gap-2">
            <PositionsImportDialog companies={companies} />
            <RoundsImportDialog companies={companies} />
          </div>

          <PositionsTable
            rows={rollups.rows}
            onViewDetails={handleViewDetails}
            onEditPosition={(row) => {
              setEditingPosition(row);
              setPositionDialogOpen(true);
            }}
          />
        </TabsContent>


        <TabsContent value="financials" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <QuarterlyImportDialog companies={companies} quartersByCompany={quartersByCompany} />
          </div>
          <FinancialComparisonTable
            positions={rollups.rows}
            quartersByCompany={quartersByCompany}
            periods={periods}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="trends" className="mt-4 space-y-3">
          <div className="flex flex-wrap justify-end gap-2">
            <RoundsImportDialog companies={companies} />
            <QuarterlyImportDialog companies={companies} quartersByCompany={quartersByCompany} />
          </div>
          <PortfolioTrendsTab
            positions={rollups.rows}
            quartersByCompany={quartersByCompany}
            roundsByCompany={roundsByCompany}
          />
        </TabsContent>



        <TabsContent value="rollups" className="mt-4 space-y-4">
          <RollupTable
            title="By vehicle"
            description="Invested capital, fair value and multiples per investment vehicle"
            firstColumnLabel="Vehicle"
            rows={rollups.byVehicle}
          />
          <RollupTable
            title="By vintage"
            description="Grouped by the year of first investment"
            firstColumnLabel="Vintage"
            rows={rollups.byVintage}
          />
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <BulkActions
            selectedItems={selectedCompanies}
            totalItems={filteredCompanies.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            actions={bulkActions}
            onAction={handleBulkAction}
            isAllSelected={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
          />
          <PortfolioGrid
            companies={companies}
            filteredCompanies={filteredCompanies}
            onViewDetails={handleViewDetails}
            onSuccess={refetch}
          />
        </TabsContent>
      </Tabs>

      <PortfolioDetailDialog
        company={selectedCompany}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onCompanyUpdated={refetch}
      />

      <PositionEditDialog
        companyId={editingPosition?.company.id ?? null}
        companyName={editingPosition?.company.company_name ?? ''}
        position={editingPosition?.position ?? null}
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
        saving={positionSaving}
        onSave={savePosition}
      />

    </div>
  );

}
