
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Deal } from '@/types/deal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DealsTableHeader } from './table/DealsTableHeader';
import { DealsTableRow } from './table/DealsTableRow';
import { useAdvancedTableSorting } from '@/hooks/deals/useAdvancedTableSorting';

interface VirtualizedDealsTableViewProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  onDealUpdated?: () => void;
  height?: number;
}

interface RowItemData {
  deals: Deal[];
  selectedDeals: string[];
  onToggleDealSelection: (dealId: string) => void;
  onViewDetails: (deal: Deal) => void;
  onDealUpdated?: () => void;
}

const TableRow = ({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: RowItemData 
}) => {
  const { deals, selectedDeals, onToggleDealSelection, onViewDetails, onDealUpdated } = data;
  const deal = deals[index];

  if (!deal) return null;

  return (
    <div style={style}>
      <DealsTableRow
        deal={deal}
        index={index}
        isSelected={selectedDeals.includes(deal.id)}
        onToggleSelection={onToggleDealSelection}
        onViewDetails={onViewDetails}
        onDealUpdated={onDealUpdated}
      />
    </div>
  );
};

export function VirtualizedDealsTableView({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onDealUpdated,
  height = 600,
}: VirtualizedDealsTableViewProps) {
  const { 
    sortedDeals, 
    sortConfigs, 
    handleSort, 
    clearSort, 
    removeSortColumn,
    getSortForColumn,
    getSortPriority
  } = useAdvancedTableSorting(deals);

  const itemData = useMemo((): RowItemData => ({
    deals: sortedDeals,
    selectedDeals,
    onToggleDealSelection,
    onViewDetails,
    onDealUpdated,
  }), [sortedDeals, selectedDeals, onToggleDealSelection, onViewDetails, onDealUpdated]);

  if (deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No deals found</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card">
          <div className="sticky top-0 z-10 bg-background border-b">
            <DealsTableHeader
              isAllSelected={isAllSelected}
              hasSelection={selectedDeals.length > 0}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
              sortConfigs={sortConfigs}
              onSort={handleSort}
              onRemoveSort={removeSortColumn}
              getSortForColumn={getSortForColumn}
              getSortPriority={getSortPriority}
            />
          </div>
          
          <List
            height={Math.min(height, sortedDeals.length * 60 + 100)}
            width="100%"
            itemCount={sortedDeals.length}
            itemSize={60}
            itemData={itemData}
            overscanCount={10}
          >
            {TableRow}
          </List>
        </div>
      </div>
    </TooltipProvider>
  );
}
