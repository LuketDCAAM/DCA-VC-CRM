
import { TableColumn, DEFAULT_COLUMNS } from './tableColumnDefinitions';

export function mergeWithDefaultColumns(savedColumns: TableColumn[]): TableColumn[] {
  // Merge with default columns to handle new columns added to the system
  return DEFAULT_COLUMNS.map(defaultCol => {
    const savedCol = savedColumns.find((sc: TableColumn) => sc.key === defaultCol.key);
    return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
  });
}
