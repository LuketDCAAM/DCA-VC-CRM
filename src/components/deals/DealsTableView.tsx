
import React from 'react';
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { Deal } from '@/types/deal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DealsTableHeader } from './table/DealsTableHeader';
import { DealsTableRow } from './table/DealsTableRow';
import { SortControls } from './table/SortControls';
import { useAdvancedTableSorting } from '@/hooks/deals/useAdvancedTableSorting';

interface DealsTableViewProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  onDealUpdated?: () => void;
}

export function DealsTableView({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onDealUpdated,
}: DealsTableViewProps) {
  const { 
    sortedDeals, 
    sortConfigs, 
    handleSort, 
    clearSort, 
    removeSortColumn,
    getSortForColumn,
    getSortPriority
  } = useAdvancedTableSorting(deals);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <SortControls
          sortConfigs={sortConfigs}
          onRemoveSort={removeSortColumn}
          onClearSort={clearSort}
        />
        
        <div className="relative overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-auto max-h-[calc(100vh-300px)]">
            <Table>
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
              <TableBody>
                {sortedDeals.map((deal, index) => (
                  <DealsTableRow
                    key={deal.id}
                    deal={deal}
                    index={index}
                    isSelected={selectedDeals.includes(deal.id)}
                    onToggleSelection={onToggleDealSelection}
                    onViewDetails={onViewDetails}
                    onDealUpdated={onDealUpdated}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
