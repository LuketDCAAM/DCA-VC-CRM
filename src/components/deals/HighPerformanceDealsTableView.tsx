
import React, { useMemo } from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Deal } from '@/types/deal';
import { OptimizedDealsTableRow } from './table/OptimizedDealsTableRow';
import { SimpleDealsTableHeader } from './table/SimpleDealsTableHeader';

interface HighPerformanceDealsTableViewProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
}

export function HighPerformanceDealsTableView({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
}: HighPerformanceDealsTableViewProps) {
  // Create a set for O(1) lookup performance
  const selectedDealsSet = useMemo(() => new Set(selectedDeals), [selectedDeals]);

  if (deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No deals found</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <Table>
          <SimpleDealsTableHeader
            isAllSelected={isAllSelected}
            hasSelection={selectedDeals.length > 0}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
          />
          <TableBody>
            {deals.map((deal, index) => (
              <OptimizedDealsTableRow
                key={deal.id}
                deal={deal}
                index={index}
                isSelected={selectedDealsSet.has(deal.id)}
                onToggleSelection={onToggleDealSelection}
                onViewDetails={onViewDetails}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
