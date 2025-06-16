
import React, { useMemo } from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { Deal } from '@/types/deal';
import { ConfigurableDealsTableRow } from './table/ConfigurableDealsTableRow';
import { ConfigurableDealsTableHeader } from './table/ConfigurableDealsTableHeader';
import { useAdvancedTableSorting } from '@/hooks/deals/useAdvancedTableSorting';
import { ColumnSelector } from './table/ColumnSelector';

interface ConfigurableDealsTableProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
}

export function ConfigurableDealsTable({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
}: ConfigurableDealsTableProps) {
  const selectedDealsSet = useMemo(() => new Set(selectedDeals), [selectedDeals]);
  
  const {
    sortedDeals,
    sortConfigs,
    handleSort,
    removeSortColumn,
    getSortForColumn,
    getSortPriority,
  } = useAdvancedTableSorting(deals);

  if (deals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No deals found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {deals.length} deals • {selectedDeals.length} selected
        </div>
        <ColumnSelector />
      </div>
      
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <Table>
            <ConfigurableDealsTableHeader
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
            <TableBody>
              {sortedDeals.map((deal, index) => (
                <ConfigurableDealsTableRow
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
    </div>
  );
}
