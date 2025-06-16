
import { useState, useMemo } from 'react';
import { Globe, Mail, DollarSign, MapPin, Calendar, Star, Building, User, Tag, FileText } from 'lucide-react';

export interface TableColumn {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  width: string;
  sortable: boolean;
  visible: boolean;
  locked?: boolean; // For columns that shouldn't be hidden (like company name)
  dataType: 'string' | 'number' | 'date' | 'currency' | 'enum' | 'score';
}

export const DEFAULT_COLUMNS: TableColumn[] = [
  {
    key: 'company_name',
    label: 'Company',
    icon: Globe,
    width: 'min-w-[280px]',
    sortable: true,
    visible: true,
    locked: true,
    dataType: 'string'
  },
  {
    key: 'contact_name',
    label: 'Contact',
    icon: Mail,
    width: 'min-w-[200px]',
    sortable: true,
    visible: true,
    dataType: 'string'
  },
  {
    key: 'pipeline_stage',
    label: 'Pipeline Stage',
    width: 'min-w-[150px]',
    sortable: true,
    visible: true,
    dataType: 'enum'
  },
  {
    key: 'round_stage',
    label: 'Round Stage',
    width: 'min-w-[130px]',
    sortable: true,
    visible: true,
    dataType: 'enum'
  },
  {
    key: 'round_size',
    label: 'Round Size',
    icon: DollarSign,
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'currency'
  },
  {
    key: 'location',
    label: 'Location',
    icon: MapPin,
    width: 'min-w-[130px]',
    sortable: true,
    visible: true,
    dataType: 'string'
  },
  {
    key: 'deal_score',
    label: 'Deal Score',
    icon: Star,
    width: 'min-w-[100px]',
    sortable: true,
    visible: true,
    dataType: 'score'
  },
  {
    key: 'deal_source',
    label: 'Source',
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'string'
  },
  {
    key: 'created_at',
    label: 'Date Added',
    icon: Calendar,
    width: 'min-w-[120px]',
    sortable: true,
    visible: true,
    dataType: 'date'
  },
  {
    key: 'post_money_valuation',
    label: 'Valuation',
    icon: DollarSign,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'currency'
  },
  {
    key: 'revenue',
    label: 'Revenue',
    icon: DollarSign,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'currency'
  },
  {
    key: 'sector',
    label: 'Sector',
    icon: Building,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'string'
  },
  {
    key: 'deal_lead',
    label: 'Deal Lead',
    icon: User,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'string'
  },
  {
    key: 'source_date',
    label: 'Source Date',
    icon: Calendar,
    width: 'min-w-[120px]',
    sortable: true,
    visible: false,
    dataType: 'date'
  },
  {
    key: 'description',
    label: 'Description',
    icon: FileText,
    width: 'min-w-[200px]',
    sortable: false,
    visible: false,
    dataType: 'string'
  }
];

const STORAGE_KEY = 'deals-table-columns';

export function useTableColumns() {
  const [columns, setColumns] = useState<TableColumn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedColumns = JSON.parse(saved);
        // Merge with default columns to handle new columns added to the system
        const mergedColumns = DEFAULT_COLUMNS.map(defaultCol => {
          const savedCol = savedColumns.find((sc: TableColumn) => sc.key === defaultCol.key);
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
        });
        return mergedColumns;
      }
    } catch (error) {
      console.error('Error loading saved column configuration:', error);
    }
    return DEFAULT_COLUMNS;
  });

  const visibleColumns = useMemo(() => columns.filter(col => col.visible), [columns]);

  const saveColumns = (newColumns: TableColumn[]) => {
    setColumns(newColumns);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
    } catch (error) {
      console.error('Error saving column configuration:', error);
    }
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
    localStorage.removeItem(STORAGE_KEY);
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
