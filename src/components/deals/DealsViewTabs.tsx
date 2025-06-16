
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid, List, Table2 } from 'lucide-react';
import { Deal } from '@/types/deal';
import { DealFilters } from '@/hooks/usePaginatedDeals';
import { DealsTableView } from './DealsTableView';
import { DealListView } from './DealListView';
import { DealsGrid } from './DealsGrid';
import { DealsBulkActions } from './DealsBulkActions';

interface DealsViewTabsProps {
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  filteredDeals: Deal[];
  onViewDetails: (deal: Deal) => void;
  onDealAdded: () => void;
  dealFilters: DealFilters;
  selectedDeals: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  isAllSelected?: boolean;
  onBulkAction?: (actionId: string, selectedIds: string[]) => void;
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
  onSelectAll = () => {},
  onDeselectAll = () => {},
  isAllSelected = false,
  onBulkAction = () => {},
  onDealUpdated,
}: DealsViewTabsProps) {
  return (
    <div className="space-y-4">
      <Tabs value={viewMode} onValueChange={onViewModeChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Grid
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <DealListView
            deals={filteredDeals}
            onViewDetails={onViewDetails}
            selectedDeals={selectedDeals}
            onToggleDealSelection={onToggleDealSelection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            isAllSelected={isAllSelected}
          />
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <DealsTableView
            deals={filteredDeals}
            onViewDetails={onViewDetails}
            selectedDeals={selectedDeals}
            onToggleDealSelection={onToggleDealSelection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            isAllSelected={isAllSelected}
            onDealUpdated={onDealUpdated}
          />
        </TabsContent>

        <TabsContent value="grid" className="mt-6">
          <DealsGrid
            deals={filteredDeals}
            onViewDetails={onViewDetails}
            selectedDeals={selectedDeals}
            onToggleDealSelection={onToggleDealSelection}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            isAllSelected={isAllSelected}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
