
import React from 'react';
import { TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AdvancedSortableTableHead } from './AdvancedSortableTableHead';
import { MultiSortConfig } from '@/hooks/deals/useAdvancedTableSorting';
import { useTableColumns } from '@/hooks/deals/useTableColumns';

interface ConfigurableDealsTableHeaderProps {
  isAllSelected: boolean;
  hasSelection: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  sortConfigs: MultiSortConfig;
  onSort: (key: string, isMultiSort?: boolean) => void;
  onRemoveSort: (key: string) => void;
  getSortForColumn: (key: string) => { key: string; direction: 'asc' | 'desc' | null } | null;
  getSortPriority: (key: string) => number | null;
}

export function ConfigurableDealsTableHeader({
  isAllSelected,
  hasSelection,
  onSelectAll,
  onDeselectAll,
  sortConfigs,
  onSort,
  onRemoveSort,
  getSortForColumn,
  getSortPriority,
}: ConfigurableDealsTableHeaderProps) {
  const { visibleColumns } = useTableColumns();

  return (
    <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm border-b">
      <TableRow className="hover:bg-transparent">
        <AdvancedSortableTableHead 
          sortKey="selection" 
          currentSort={null}
          sortPriority={null}
          onSort={() => {}}
          canSort={false}
          className="w-12 sticky left-0 z-30 bg-muted/80 backdrop-blur-sm border-r"
        >
          <Checkbox
            checked={isAllSelected ? true : (hasSelection ? 'indeterminate' : false)}
            onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
            aria-label="Select all"
          />
        </AdvancedSortableTableHead>
        
        {visibleColumns.map((column, index) => (
          <AdvancedSortableTableHead 
            key={column.key}
            sortKey={column.key} 
            currentSort={getSortForColumn(column.key)}
            sortPriority={getSortPriority(column.key)}
            onSort={onSort}
            onRemoveSort={onRemoveSort}
            canSort={column.sortable}
            className={`
              ${column.width} font-semibold
              ${column.key === 'company_name' ? 'sticky left-12 z-30 bg-muted/80 backdrop-blur-sm border-r' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              {column.icon && <column.icon className="h-4 w-4" />}
              {column.label}
            </div>
          </AdvancedSortableTableHead>
        ))}
        
        <AdvancedSortableTableHead 
          sortKey="actions" 
          currentSort={null}
          sortPriority={null}
          onSort={() => {}}
          canSort={false}
          className="text-right min-w-[80px] font-semibold"
        >
          Actions
        </AdvancedSortableTableHead>
      </TableRow>
    </TableHeader>
  );
}
