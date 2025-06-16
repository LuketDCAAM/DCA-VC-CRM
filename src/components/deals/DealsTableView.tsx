
import React from 'react';
import {
  Table,
  TableBody,
} from "@/components/ui/table";
import { Deal } from '@/types/deal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DealsTableHeader } from './table/DealsTableHeader';
import { DealsTableRow } from './table/DealsTableRow';

interface DealsTableViewProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
}

export function DealsTableView({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
}: DealsTableViewProps) {
  return (
    <TooltipProvider>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <Table>
            <DealsTableHeader
              isAllSelected={isAllSelected}
              hasSelection={selectedDeals.length > 0}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
            />
            <TableBody>
              {deals.map((deal, index) => (
                <DealsTableRow
                  key={deal.id}
                  deal={deal}
                  index={index}
                  isSelected={selectedDeals.includes(deal.id)}
                  onToggleSelection={onToggleDealSelection}
                  onViewDetails={onViewDetails}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
