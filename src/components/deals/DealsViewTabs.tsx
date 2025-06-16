import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, Table, BarChart3 } from "lucide-react";
import { Deal } from '@/types/deal';
import { DealFilters } from '@/hooks/usePaginatedDeals';
import { DealListView } from './DealListView';
import { HighPerformanceDealsTableView } from './HighPerformanceDealsTableView';
import { DealPipelineBoard } from './DealPipelineBoard';

interface DealsViewTabsProps {
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  filteredDeals: Deal[];
  onViewDetails: (deal: Deal) => void;
  onDealAdded?: () => void;
  dealFilters: DealFilters;
  selectedDeals: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  onBulkAction: (actionId: string, selectedIds: string[]) => void;
  onDealUpdated?: () => void;
}

export function DealsViewTabs({
  viewMode,
  onViewModeChange,
  filteredDeals,
  onViewDetails,
  onDealAdded,
  dealFilters,  
  selectedDeals,
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onBulkAction,
  onDealUpdated,
}: DealsViewTabsProps) {
  return (
    <Tabs value={viewMode} onValueChange={onViewModeChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="list" className="flex items-center gap-2">
          <Grid className="h-4 w-4" />
          List View
        </TabsTrigger>
        <TabsTrigger value="table" className="flex items-center gap-2">
          <Table className="h-4 w-4" />
          Table View
        </TabsTrigger>
        <TabsTrigger value="pipeline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pipeline Board
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="space-y-4">
        <DealListView
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          selectedDeals={selectedDeals}
          onToggleDealSelection={onToggleDealSelection}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          isAllSelected={isAllSelected}
          onDealAdded={onDealAdded}
        />
      </TabsContent>

      <TabsContent value="table" className="space-y-4">
        <HighPerformanceDealsTableView
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          selectedDeals={selectedDeals}
          onToggleDealSelection={onToggleDealSelection}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          isAllSelected={isAllSelected}
        />
      </TabsContent>

      <TabsContent value="pipeline" className="space-y-4">
        <DealPipelineBoard 
          deals={filteredDeals}
          onViewDetails={onViewDetails}
          onDealUpdated={onDealUpdated}
        />
      </TabsContent>
    </Tabs>
  );
}
