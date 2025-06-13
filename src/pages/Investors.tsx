
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit, Archive, Upload } from 'lucide-react';
import { useInvestors } from '@/hooks/useInvestors';
import { InvestorCard } from '@/components/investors/InvestorCard';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { ExportData } from '@/components/common/ExportData';
import { CSVImport } from '@/components/common/CSVImport';
import { useCSVImport } from '@/hooks/useCSVImport';

export default function Investors() {
  const { investors, loading, refetch } = useInvestors();
  const { importInvestors } = useCSVImport();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // CSV template columns for investors
  const csvTemplateColumns = [
    { key: 'contact_name', label: 'Contact Name', required: true },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'contact_phone', label: 'Contact Phone' },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'firm_website', label: 'Firm Website' },
    { key: 'location', label: 'Location' },
    { key: 'preferred_investment_stage', label: 'Preferred Investment Stage' },
    { key: 'average_check_size', label: 'Average Check Size ($)' },
    { key: 'preferred_sectors', label: 'Preferred Sectors (separated by ;)' },
    { key: 'tags', label: 'Tags (separated by ;)' },
    { key: 'relationship_owner', label: 'Relationship Owner' },
  ];

  const handleCSVImport = async (data: any[]) => {
    const result = await importInvestors(data);
    if (result.success) {
      refetch();
    }
    return result;
  };

  // Filter options for investors
  const filterOptions: FilterOption[] = [
    {
      key: 'preferred_investment_stage',
      label: 'Investment Stage',
      value: 'preferred_investment_stage',
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
      key: 'average_check_size',
      label: 'Check Size',
      value: 'average_check_size',
      type: 'range'
    },
    {
      key: 'created_at',
      label: 'Date Added',
      value: 'created_at',
      type: 'date'
    }
  ];

  // Bulk actions for investors
  const bulkActions: BulkAction[] = [
    {
      id: 'update-stage',
      label: 'Update Investment Stage',
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

  // Export columns for investors
  const exportColumns = [
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'location', label: 'Location' },
    { key: 'preferred_investment_stage', label: 'Investment Stage' },
    { key: 'average_check_size', label: 'Average Check Size' },
    { key: 'created_at', label: 'Date Added' },
  ];

  const filteredInvestors = investors.filter(investor => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      investor.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.firm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Active filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value || value === 'all' || value === '') return true;
      
      if (key === 'created_at') {
        const investorDate = new Date(investor.created_at).toISOString().split('T')[0];
        return investorDate >= value;
      }
      
      if (key === 'average_check_size_min') {
        return !investor.average_check_size || investor.average_check_size >= parseInt(value) * 100;
      }
      
      if (key === 'average_check_size_max') {
        return !investor.average_check_size || investor.average_check_size <= parseInt(value) * 100;
      }
      
      return investor[key as keyof typeof investor] === value;
    });

    return matchesSearch && matchesFilters;
  });

  const handleViewDetails = (investor: any) => {
    setSelectedInvestor(investor);
    // TODO: Implement investor detail dialog
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
    console.log(`Bulk action ${actionId} on investors:`, selectedIds);
    // TODO: Implement actual bulk actions
    setSelectedInvestors([]);
  };

  const handleSelectAll = () => {
    setSelectedInvestors(filteredInvestors.map(investor => investor.id));
  };

  const handleDeselectAll = () => {
    setSelectedInvestors([]);
  };

  // Prepare export data with calculated fields
  const exportData = filteredInvestors.map(investor => ({
    ...investor,
    average_check_size: investor.average_check_size ? investor.average_check_size / 100 : null,
  }));

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading investors...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-gray-600">Manage your investor relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportData
            data={exportData}
            filename="investors"
            columns={exportColumns}
            loading={loading}
          />
          <CSVImport
            title="Import Investors"
            description="Upload a CSV file to import multiple investors at once"
            templateColumns={csvTemplateColumns}
            onImport={handleCSVImport}
          >
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </CSVImport>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Investor
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{investors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">With Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {investors.filter(i => i.contact_email || i.contact_phone).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Firm Investors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {investors.filter(i => i.firm_name).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Check Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {investors.filter(i => i.average_check_size).length > 0 ? 
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimum

FractionDigits: 0,
                }).format(
                  investors.filter(i => i.average_check_size).reduce((sum, i) => sum + (i.average_check_size || 0), 0) / 
                  (investors.filter(i => i.average_check_size).length * 100)
                ) : '$0'
              }
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
        placeholder="Search investors by name, firm, or location..."
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedInvestors}
        totalItems={filteredInvestors.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        actions={bulkActions}
        onAction={handleBulkAction}
        isAllSelected={selectedInvestors.length === filteredInvestors.length && filteredInvestors.length > 0}
      />

      {/* Investors Grid */}
      {filteredInvestors.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Investors Found</CardTitle>
            <CardDescription>
              {investors.length === 0 
                ? "You haven't added any investors yet."
                : "No investors match your current filters."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {investors.length === 0 
                  ? "Start by adding your first investor to track relationships."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {investors.length === 0 && (
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first investor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestors.map((investor) => (
            <InvestorCard 
              key={investor.id} 
              investor={investor}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
