
import React from 'react';
import { TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import { SortDirection } from '@/hooks/deals/useAdvancedTableSorting';

interface AdvancedSortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection } | null;
  sortPriority: number | null;
  onSort: (key: string, isMultiSort?: boolean) => void;
  onRemoveSort?: (key: string) => void;
  className?: string;
  canSort?: boolean;
}

export function AdvancedSortableTableHead({
  children,
  sortKey,
  currentSort,
  sortPriority,
  onSort,
  onRemoveSort,
  className,
  canSort = true
}: AdvancedSortableTableHeadProps) {
  if (!canSort) {
    return (
      <TableHead className={className}>
        <div className="flex items-center gap-2 font-semibold">
          {children}
        </div>
      </TableHead>
    );
  }

  const getSortIcon = () => {
    if (!currentSort) {
      return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    
    return currentSort.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const handleClick = (e: React.MouseEvent) => {
    const isMultiSort = e.ctrlKey || e.metaKey;
    onSort(sortKey, isMultiSort);
  };

  const handleRemoveSort = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveSort?.(sortKey);
  };

  return (
    <TableHead className={className}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 font-semibold hover:bg-muted/50 text-left justify-start flex-1"
          onClick={handleClick}
          title={`Click to sort, Ctrl+Click for multi-column sort`}
        >
          <div className="flex items-center gap-2">
            {children}
            {getSortIcon()}
          </div>
        </Button>
        
        {currentSort && sortPriority && (
          <div className="flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className="text-xs h-5 px-1.5 bg-primary/10 text-primary border-primary/20"
            >
              {sortPriority}
            </Badge>
            {onRemoveSort && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleRemoveSort}
                title="Remove sort"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </TableHead>
  );
}
