
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
    <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm border-b-2 border-border">
      <TableRow className="hover:bg-transparent h-12 border-b border-border/50">
        <AdvancedSortableTableHead 
          sortKey="selection" 
          currentSort={null}
          sortPriority={null}
          onSort={() => {}}
          canSort={false}
          className="w-12 sticky left-0 z-30 bg-muted/95 backdrop-blur-sm border-r border-border/50 py-3 px-4"
        >
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isAllSelected ? true : (hasSelection ? 'indeterminate' : false)}
              onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
              aria-label="Select all"
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        </AdvancedSortableTableHead>
        
        {visibleColumns.map((column, index) => {
          const IconComponent = column.icon;
          
          return (
            <AdvancedSortableTableHead 
              key={column.key}
              sortKey={column.key} 
              currentSort={getSortForColumn(column.key)}
              sortPriority={getSortPriority(column.key)}
              onSort={onSort}
              onRemoveSort={onRemoveSort}
              canSort={column.sortable}
              className={`
                ${column.width} font-semibold text-xs text-foreground py-3 px-4
                ${column.key === 'company_name' ? 'sticky left-12 z-30 bg-muted/95 backdrop-blur-sm border-r border-border/50' : ''}
                hover:bg-muted/60 transition-colors
              `}
            >
              <div className="flex items-center gap-2">
                {IconComponent && typeof IconComponent === 'function' && (
                  <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-foreground">{column.label}</span>
              </div>
            </AdvancedSortableTableHead>
          );
        })}
        
        <AdvancedSortableTableHead 
          sortKey="actions" 
          currentSort={null}
          sortPriority={null}
          onSort={() => {}}
          canSort={false}
          className="text-right min-w-[80px] font-semibold text-xs text-foreground py-3 px-4"
        >
          Actions
        </AdvancedSortableTableHead>
      </TableRow>
    </TableHeader>
  );
}
