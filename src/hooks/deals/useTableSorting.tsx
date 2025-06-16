
import { useState, useMemo } from 'react';
import { Deal } from '@/types/deal';

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig = { key: string; direction: SortDirection } | null;

export function useTableSorting(deals: Deal[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig?.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig(direction ? { key, direction } : null);
  };

  const sortedDeals = useMemo(() => {
    if (!sortConfig) return deals;

    const { key, direction } = sortConfig;
    
    return [...deals].sort((a, b) => {
      let aValue: any = a[key as keyof Deal];
      let bValue: any = b[key as keyof Deal];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === 'asc' ? 1 : -1;
      if (bValue == null) return direction === 'asc' ? -1 : 1;

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [deals, sortConfig]);

  return {
    sortedDeals,
    sortConfig,
    handleSort
  };
}
