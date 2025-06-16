
import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Table, TableBody } from "@/components/ui/table";
import { Deal } from '@/types/deal';
import { OptimizedDealsTableRow } from './table/OptimizedDealsTableRow';
import { SimpleDealsTableHeader } from './table/SimpleDealsTableHeader';

interface VirtualizedDealsTableProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  height?: number;
}

// Row component for react-window
const TableRow = React.memo(({ index, style, data }: any) => {
  const { deals, selectedDealsSet, onToggleDealSelection, onViewDetails } = data;
  const deal = deals[index];
  
  return (
    <div style={style}>
      <OptimizedDealsTableRow
        key={deal.id}
        deal={deal}
        index={index}
        isSelected={selectedDealsSet.has(deal.id)}
        onToggleSelection={onToggleDealSelection}
        onViewDetails={onViewDetails}
      />
    </div>
  );
});

TableRow.displayName = 'VirtualizedTableRow';

export function VirtualizedDealsTable({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  height = 500,
}: VirtualizedDealsTableProps) {
  // Create a set for O(1) lookup performance
  const selectedDealsSet = useMemo(() => new Set(selectedDeals), [selectedDeals]);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    deals,
    selectedDealsSet,
    onToggleDealSelection,
    onViewDetails,
  }), [deals, selectedDealsSet, onToggleDealSelection, onViewDetails]);

  const handleViewDetails = useCallback((deal: Deal) => {
    onViewDetails(deal);
  }, [onViewDetails]);

  if (deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No deals found</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <SimpleDealsTableHeader
          isAllSelected={isAllSelected}
          hasSelection={selectedDeals.length > 0}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
        />
      </Table>
      
      <div className="overflow-auto">
        <List
          height={height}
          itemCount={deals.length}
          itemSize={80} // Height of each row
          itemData={itemData}
          overscanCount={5} // Render 5 extra items for smooth scrolling
        >
          {TableRow}
        </List>
      </div>
    </div>
  );
}
