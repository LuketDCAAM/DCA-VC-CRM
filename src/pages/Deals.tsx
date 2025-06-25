import React, { useState } from 'react'; // Ensure useState is imported
import { useOptimizedDeals } from '@/hooks/useOptimizedDeals';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { useCSVImport } from '@/hooks/useCSVImport';
import { useOptimizedFilteredDeals } from '@/hooks/useOptimizedFilteredDeals';
import { DealsPageContent } from '@/components/deals/DealsPageContent';
import { useDealsPageState } from '@/hooks/useDealsPageState';
import { useDealsCSVConfig } from '@/components/deals/DealsCSVConfig';

// Import necessary Shadcn UI components for the Dialog and the Button
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Import your AddDealForm component
import { AddDealForm } from '@/components/deals/form/AddDealForm';


export default function Deals() {
  const { deals, loading, refetch, dealStats } = useOptimizedDeals();
  const { importDeals } = useCSVImport();
  const { csvTemplateColumns, exportColumns, handleCSVImport } = useDealsCSVConfig();

  const {
    searchTerm,
    selectedDeal,
    showDetailDialog,
    viewMode,
    selectedDeals,
    showAdvancedFilters,
    activeFilters,
    setSearchTerm,
    setSelectedDeal,
    setShowDetailDialog,
    setViewMode,
    setShowAdvancedFilters,
    handleViewDetails,
    handleFilterChange,
    handleClearFilters,
    handleToggleDealSelection,
    handleSelectAll,
    handleDeselectAll,
    handleBulkAction,
  } = useDealsPageState();

  // State to control the "Add New Deal" modal
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);

  console.log('=== DEALS PAGE RENDER ===');
  console.log('Deals page - dealStats from hook:', dealStats);
  console.log('Deals page - total deals array length:', deals.length);
  console.log('Deals page - loading state:', loading);

  const handleCSVImportWrapper = async (data: any[]) => {
    console.log('CSV Import wrapper called with', data.length, 'rows');
    
    const processResult = await handleCSVImport(data);
    console.log('Process result:', processResult);
    
    if (!processResult.success) {
      return {
        success: false,
        error: processResult.error,
        errors: processResult.errors
      };
    }
    
    const result = await importDeals(processResult.data);
    console.log('Import result:', result);
    
    if (result.success) {
      await refetch();
    }
    
    return {
      success: result.success,
      imported: result.imported,
      errors: result.errors || processResult.errors
    };
  };

  // Callback for when a new deal is successfully added
  const handleAddDealSuccess = () => {
    setIsAddDealModalOpen(false); // Close the modal
    refetch(); // Refetch deals to show the newly added one
  };

  // Callback for when the add deal form is cancelled
  const handleAddDealCancel = () => {
    setIsAddDealModalOpen(false); // Close the modal
  };

  // Use optimized filtered deals hook
  const filteredDeals = useOptimizedFilteredDeals(deals, searchTerm, activeFilters);

  const isAllSelected = selectedDeals.length === filteredDeals.length && filteredDeals.length > 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deals Pipeline</h1>
        
        {/* The "Add New Deal" Button and Dialog */}
        <Dialog open={isAddDealModalOpen} onOpenChange={setIsAddDealModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
            </DialogHeader>
            {/* The AddDealForm component goes here */}
            <AddDealForm 
              onSuccess={handleAddDealSuccess} 
              onCancel={handleAddDealCancel} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <DealsPageContent
        filteredDeals={filteredDeals}
        dealStats={dealStats}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        selectedDeals={selectedDeals}
        onSelectAll={handleSelectAll(filteredDeals)}
        onDeselectAll={handleDeselectAll}
        onBulkAction={handleBulkAction}
        isAllSelected={isAllSelected}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onViewDetails={handleViewDetails}
        onToggleDealSelection={handleToggleDealSelection}
        // These props are less critical here as the Add/Edit is handled via modal/dialog
        onDealAdded={refetch} // Kept for consistency, but modal handles it now
        onDealUpdated={refetch} // Kept for consistency, but modal handles it now
        csvTemplateColumns={csvTemplateColumns}
        exportColumns={exportColumns}
        onCSVImport={handleCSVImportWrapper}
        allDeals={deals}
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
