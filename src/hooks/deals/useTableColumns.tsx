
import { useState, useMemo } from 'react';
import { TableColumn, DEFAULT_COLUMNS } from './tableColumnDefinitions';
import { saveColumnsToStorage, loadColumnsFromStorage, clearColumnStorage } from './tableColumnStorage';
import { mergeWithDefaultColumns } from './columnMerger';

export { type TableColumn, DEFAULT_COLUMNS } from './tableColumnDefinitions';

export function useTableColumns() {
  const [columns, setColumns] = useState<TableColumn[]>(() => {
    const savedColumns = loadColumnsFromStorage();
    if (savedColumns) {
      return mergeWithDefaultColumns(savedColumns);
    }
    return DEFAULT_COLUMNS;
  });

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  const saveColumns = (newColumns: TableColumn[]) => {
    setColumns(newColumns);
    saveColumnsToStorage(newColumns);
  };

  const updateColumn = (key: string, updates: Partial<TableColumn>) => {
    const newColumns = columns.map(col => 
      col.key === key ? { ...col, ...updates } : col
    );
    saveColumns(newColumns);
  };

  const reorderColumns = (newOrder: string[]) => {
    const reordered = newOrder.map(key => 
      columns.find(col => col.key === key)!
    ).filter(Boolean);
    
    // Add any columns not in the new order at the end
    const remainingColumns = columns.filter(col => 
      !newOrder.includes(col.key)
    );
    
    saveColumns([...reordered, ...remainingColumns]);
  };

  const resetToDefault = () => {
    saveColumns([...DEFAULT_COLUMNS]);
    clearColumnStorage();
  };

  const toggleColumnVisibility = (key: string) => {
    updateColumn(key, { visible: !columns.find(col => col.key === key)?.visible });
  };

  return {
    columns,
    visibleColumns,
    updateColumn,
    reorderColumns,
    resetToDefault,
    toggleColumnVisibility,
    saveColumns
  };
}
