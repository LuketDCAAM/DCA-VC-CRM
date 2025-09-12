import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Deal } from '@/types/deal';
import { ViewMode } from '@/components/deals/views/DealsViewRenderer';
import { useToast } from '@/hooks/use-toast';

export function useDealsPageState() {
  const { toast } = useToast();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('configurable');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Handle navigation state for deal details
  useEffect(() => {
    const state = location.state as { selectedDeal?: Deal } | null;
    if (state?.selectedDeal) {
      setSelectedDeal(state.selectedDeal);
      setShowDetailDialog(true);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    // Clear all filters by setting them to empty arrays or empty strings
    const clearedFilters: Record<string, any> = {};
    Object.keys(activeFilters).forEach(key => {
      const isMultiSelect = ['pipeline_stage', 'round_stage', 'sector', 'location', 'deal_source'].includes(key);
      clearedFilters[key] = isMultiSelect ? [] : '';
    });
    setActiveFilters(clearedFilters);
    setSearchTerm('');
  }, [activeFilters]);

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

  const handleBulkAction = useMemo(() => async (actionId: string, selectedIds: string[]): Promise<void> => {
    console.log(`Bulk action ${actionId} on deals:`, selectedIds);
    
    try {
      if (actionId === 'delete') {
        // Import supabase client dynamically to avoid circular dependencies
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { error } = await supabase
          .from('deals')
          .delete()
          .in('id', selectedIds);

        if (error) {
          throw error;
        }

        toast({
          title: "Deals deleted",
          description: `Successfully deleted ${selectedIds.length} deal(s).`,
        });
      }
      // Add other bulk actions here (move-to-stage, archive, etc.)
      
    } catch (error) {
      console.error(`Error performing bulk action ${actionId}:`, error);
      
      toast({
        title: "Action failed",
        description: `Failed to ${actionId} selected deals. Please try again.`,
        variant: "destructive",
      });
      
      throw error; // Re-throw to be handled by the calling component
    } finally {
      setSelectedDeals([]);
    }
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
