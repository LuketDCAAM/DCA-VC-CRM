import React, { useState } from 'react';
import { Edit, Archive, Trash2, RefreshCw, Upload, Plus } from 'lucide-react';
import { usePortfolioCompanies, PortfolioCompany } from '@/hooks/usePortfolioCompanies';
import { PortfolioDetailDialog } from '@/components/portfolio/PortfolioDetailDialog';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { PortfolioStats } from '@/components/portfolio/PortfolioStats';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';

export default function Portfolio() {
  const { companies, loading, refetch } = usePortfolioCompanies();
  const { importPortfolioCompanies } = useCSVImport();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<PortfolioCompany | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

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
      
      return company[key as keyof typeof company] === value;
    });

    return matchesSearch && matchesFilters;
  });

  const totalInvested = companies.reduce((sum, company) => 
    sum + company.investments.reduce((invSum, inv) => invSum + inv.amount_invested, 0), 0
  );

  const activeCompanies = companies.filter(c => c.status === 'Active').length;

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
    console.log(`Bulk action ${actionId} on portfolio companies:`, selectedIds);
    // TODO: Implement actual bulk actions
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading portfolio companies...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PortfolioHeader
        exportData={exportData}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onImport={handleCSVImport}
        onSync={handleSyncInvestedDeals}
        onSuccess={refetch}
      />

      <PortfolioStats
        totalCompanies={companies.length}
        activeCompanies={activeCompanies}
        totalInvested={totalInvested}
      />

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

      <PortfolioDetailDialog
        company={selectedCompany}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onCompanyUpdated={refetch}
      />
    </div>
  );
}
