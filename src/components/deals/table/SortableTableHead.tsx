
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection } | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTableHead({
  children,
  sortKey,
  currentSort,
  onSort,
  className
}: SortableTableHeadProps) {
  const getSortIcon = () => {
    if (currentSort?.key !== sortKey) {
      return <ChevronsUpDown className="h-3 w-3" />;
    }
    
    return currentSort.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 font-semibold hover:bg-muted/50 text-left justify-start"
        onClick={() => onSort(sortKey)}
      >
        <div className="flex items-center gap-2">
          {children}
          {getSortIcon()}
        </div>
      </Button>
    </TableHead>
  );
}
