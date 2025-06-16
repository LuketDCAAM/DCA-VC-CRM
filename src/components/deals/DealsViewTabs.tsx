
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';
import { DealPipelineBoard } from '@/components/deals/DealPipelineBoard';
import { EnhancedDealListView } from '@/components/deals/EnhancedDealListView';
import { DealsTableView } from '@/components/deals/DealsTableView';
import { Deal } from '@/types/deal';
import { DealFilters } from '@/hooks/usePaginatedDeals';

interface DealsViewTabsProps {
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  filteredDeals: Deal[];
  onViewDetails: (deal: Deal) => void;
  onDealAdded: () => void;
  dealFilters: DealFilters;
  selectedDeals?: string[];
  onToggleDealSelection?: (dealId: string) => void;
}

export function DealsViewTabs({
  viewMode,
  onViewModeChange,
  filteredDeals,
  onViewDetails,
  onDealAdded,
  dealFilters,
  selectedDeals = [],
  onToggleDealSelection = () => {},
}: DealsViewTabsProps) {
  const handleSelectAll = () => {
    // This will be handled by the parent component
  };

  const handleDeselectAll = () => {
    // This will be handled by the parent component  
  };

  const isAllSelected = selectedDeals.length === filteredDeals.length && filteredDeals.length > 0;

  return (
    <div className="mt-6">
      <Tabs value={viewMode} onValueChange={onViewModeChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Pipeline Board
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Enhanced List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <DealsTableView
            deals={filteredDeals}
            onViewDetails={onViewDetails}
            selectedDeals={selectedDeals}
            onToggleDealSelection={onToggleDealSelection}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            isAllSelected={isAllSelected}
          />
        </TabsContent>

        <TabsContent value="board">
          <DealPipelineBoard deals={filteredDeals} onViewDetails={onViewDetails} />
        </TabsContent>

        <TabsContent value="enhanced">
          <EnhancedDealListView
            onViewDetails={onViewDetails}
            onDealAdded={onDealAdded}
            filters={dealFilters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
