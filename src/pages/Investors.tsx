import React, { useState, useEffect } from 'react'; // Added useEffect
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit, Archive, LayoutGrid, List } from 'lucide-react';
import { useInvestors } from '@/hooks/useInvestors';
import { InvestorCard } from '@/components/investors/InvestorCard';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { useCSVImport } from '@/hooks/useCSVImport';
import { AddInvestorDialog } from '@/components/investors/AddInvestorDialog';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { InvestorListView } from '@/components/investors/InvestorListView';
import { InvestorsPageHeader } from '@/components/investors/InvestorsPageHeader';
import { InvestorStats } from '@/components/investors/InvestorStats';
import { NoInvestorsFound } from '@/components/investors/NoInvestorsFound';
import { Investor } from '@/types/investor';

// Define a type for the investor form data (matching what AddInvestorDialog expects)
interface InvestorFormData {
  contact_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  firm_name?: string | null;
  firm_website?: string | null;
  linkedin_url?: string | null;
  location?: string | null;
  preferred_investment_stage?: string | null; // Use string as per enum
  average_check_size?: number | null;
  preferred_sectors?: string | null;
  tags?: string | null;
  last_call_date?: string | null;
}

const LOCAL_STORAGE_DRAFT_KEY = 'investorAddFormDraft';

export default function Investors() {
  const { investors, loading, refetch, deleteInvestor } = useInvestors();
  const { importInvestors } = useCSVImport();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [investorForNewContact, setInvestorForNewContact] = useState<Investor | null>(null);
  const [draftInvestorData, setDraftInvestorData] = useState<InvestorFormData | undefined>(undefined); // New state for draft data

  // Load draft data from local storage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
    if (savedDraft) {
      try {
        setDraftInvestorData(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse investor draft from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY); // Clear corrupted data
      }
    }
  }, []);

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
      (investor.firm_name && investor.firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (investor.location && investor.location.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const handleViewDetails = (investor: Investor) => {
    setSelectedInvestor(investor);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedInvestor(null); // Ensure no investor is selected for 'add' mode
    setIsDialogOpen(true);
  };

  const handleAddContactForInvestor = (investor: Investor) => {
    setInvestorForNewContact(investor);
    setIsContactDialogOpen(true);
  };

  const handleDelete = async (investorId: string) => {
    if (window.confirm('Are you sure you want to delete this investor?')) {
      await deleteInvestor(investorId);
    }
  };

  const handleDialogSuccess = () => {
    refetch();
    // Clear draft data on successful submission
    setDraftInvestorData(undefined);
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
  };

  // Handler for the Dialog component's onOpenChange prop
  const handleDialogVisibilityChange = (newOpenState: boolean) => {
    setIsDialogOpen(newOpenState);
  };

  // Handler for the AddInvestorDialog's onCloseWithoutSave prop
  const handleSaveDraftData = (formData: InvestorFormData) => {
    // Only save draft if it's an 'add' operation (not editing)
    if (!selectedInvestor) { 
      setDraftInvestorData(formData);
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(formData));
    }
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

  const handleToggleInvestorSelection = (investorId: string) => {
    setSelectedInvestors(prevSelected =>
      prevSelected.includes(investorId)
        ? prevSelected.filter(id => id !== investorId)
        : [...prevSelected, investorId]
    );
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
      <InvestorsPageHeader
        onAddNew={handleAddNew}
        exportData={exportData}
        exportColumns={exportColumns}
        loading={loading}
        csvTemplateColumns={csvTemplateColumns}
        onCSVImport={handleCSVImport}
      />

      <InvestorStats investors={investors} />

      {/* Search and Filt