
import { Deal, PipelineStage, RoundStage } from '@/types/deal';
import React, { useMemo } from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { ConfigurableDealsTableRow } from './table/ConfigurableDealsTableRow';
import { ConfigurableDealsTableHeader } from './table/ConfigurableDealsTableHeader';
import { useAdvancedTableSorting } from '@/hooks/deals/useAdvancedTableSorting';
import { useDealsPagination } from '@/hooks/deals/useDealsPagination';
import { PaginationControls } from './PaginationControls';

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

  const {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedDeals,
    handlePageChange,
    handlePageSizeChange,
  } = useDealsPagination(sortedDeals);

  if (deals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold text-foreground mb-2">No deals found</h3>
          <p className="text-sm text-muted-foreground">
            No deals match your current filters. Try adjusting your search or filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-foreground">
            {deals.length} deals
          </div>
          {selectedDeals.length > 0 && (
            <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-md">
              {selectedDeals.length} selected
            </div>
          )}
        </div>
      </div>
      
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-280px)]">
          <Table className="w-full">
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
              {paginatedDeals.map((deal, index) => (
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

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
