
import { useState, useMemo } from 'react';
import { Deal } from '@/types/deal';

export function useDealsPageState() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

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

  const handleToggleDealSelection = useMemo(() => (dealId: string) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  }, []);

  const handleSelectAll = useMemo(() => (deals: Deal[]) => () => {
    setSelectedDeals(deals.map(deal => deal.id));
  }, []);

  const handleDeselectAll = useMemo(() => () => {
    setSelectedDeals([]);
  }, []);

  const handleBulkAction = useMemo(() => (actionId: string, selectedIds: string[]) => {
    console.log(`Bulk action ${actionId} on deals:`, selectedIds);
    setSelectedDeals([]);
  }, []);

  return {
    // State
    searchTerm,
    selectedDeal,
    showDetailDialog,
    viewMode,
    selectedDeals,
    showAdvancedFilters,
    activeFilters,
    
    // Setters
    setSearchTerm,
    setSelectedDeal,
    setShowDetailDialog,
    setViewMode,
    setShowAdvancedFilters,
    
    // Handlers
    handleViewDetails,
    handleFilterChange,
    handleClearFilters,
    handleToggleDealSelection,
    handleSelectAll,
    handleDeselectAll,
    handleBulkAction,
  };
}
