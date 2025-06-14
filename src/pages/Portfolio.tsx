import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Archive, Upload, RefreshCw } from 'lucide-react';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import { PortfolioDetailDialog } from '@/components/portfolio/PortfolioDetailDialog';
import AddPortfolioDialog from '@/components/portfolio/AddPortfolioDialog';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { ExportData } from '@/components/common/ExportData';
import { CSVImport } from '@/components/common/CSVImport';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Portfolio() {
  const { companies, loading, refetch } = usePortfolioCompanies();
  const { importPortfolioCompanies } = useCSVImport();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
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
  const exitedCompanies = companies.filter(c => c.status === 'Exited').length;

  const handleViewDetails = (company: any) => {
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

  const handleBulkAction = (actionId: string, selectedIds: string[]) => {
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Companies</h1>
          <p className="text-gray-600">Track your invested companies</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportData
            data={exportData}
            filename="portfolio-companies"
            columns={exportColumns}
            loading={loading}
          />
          <CSVImport
            title="Import Portfolio Companies"
            description="Upload a CSV file to import multiple portfolio companies at once"
            templateColumns={csvTemplateColumns}
            onImport={handleCSVImport}
          >
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </CSVImport>
          <Button variant="outline" size="sm" onClick={handleSyncInvestedDeals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Invested Deals
          </Button>
          <AddPortfolioDialog onSuccess={refetch}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </AddPortfolioDialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(totalInvested / 100)}
            </div>
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
        placeholder="Search companies..."
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedCompanies}
        totalItems={filteredCompanies.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        actions={bulkActions}
        onAction={handleBulkAction}
        isAllSelected={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
      />

      {/* Portfolio Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Portfolio Companies</CardTitle>
            <CardDescription>
              {companies.length === 0 
                ? "You haven't added any portfolio companies yet."
                : "No companies match your current filters."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {companies.length === 0 
                  ? "Start by adding your first portfolio company or mark a deal as 'Invested' to automatically create one."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {companies.length === 0 && (
                <AddPortfolioDialog onSuccess={refetch}>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first portfolio company
                  </Button>
                </AddPortfolioDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <PortfolioCard 
              key={company.id} 
              company={company}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      <PortfolioDetailDialog
        company={selectedCompany}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onCompanyUpdated={refetch}
      />
    </div>
  );
}
