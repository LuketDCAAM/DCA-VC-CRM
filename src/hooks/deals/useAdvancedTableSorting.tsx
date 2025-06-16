
import { useState, useMemo } from 'react';
import { Deal } from '@/types/deal';

export type SortDirection = 'asc' | 'desc' | null;
export type SortConfig = { key: string; direction: SortDirection };
export type MultiSortConfig = SortConfig[];

// Define column data types for better sorting
export const COLUMN_DATA_TYPES = {
  company_name: 'string',
  contact_name: 'string',
  pipeline_stage: 'enum',
  round_stage: 'enum',
  round_size: 'currency',
  location: 'string',
  deal_score: 'number',
  deal_source: 'string',
  created_at: 'date',
  post_money_valuation: 'currency',
  revenue: 'currency',
  source_date: 'date',
} as const;

// Pipeline stage order for proper enum sorting
const PIPELINE_STAGE_ORDER = [
  'Seen Not Reviewed',
  'Initial Review', 
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Term Sheet',
  'Legal Review',
  'Invested',
  'Passed'
];

const ROUND_STAGE_ORDER = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B', 
  'Series C',
  'Series D+',
  'Growth',
  'Bridge'
];

function getValueForSorting(deal: Deal, key: string, dataType: string): any {
  const rawValue = deal[key as keyof Deal];
  
  if (rawValue == null) return null;
  
  switch (dataType) {
    case 'string':
      return typeof rawValue === 'string' ? rawValue.toLowerCase() : String(rawValue).toLowerCase();
    
    case 'number':
    case 'currency':
      return typeof rawValue === 'number' ? rawValue : 0;
    
    case 'date':
      return new Date(String(rawValue));
    
    case 'enum':
      if (key === 'pipeline_stage') {
        return PIPELINE_STAGE_ORDER.indexOf(String(rawValue));
      }
      if (key === 'round_stage') {
        return ROUND_STAGE_ORDER.indexOf(String(rawValue));
      }
      return String(rawValue).toLowerCase();
    
    default:
      return rawValue;
  }
}

function compareValues(a: any, b: any, direction: SortDirection): number {
  // Handle null values - always put them at the end
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  
  let comparison = 0;
  
  if (a instanceof Date && b instanceof Date) {
    comparison = a.getTime() - b.getTime();
  } else if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  } else {
    // String comparison
    const aStr = String(a);
    const bStr = String(b);
    comparison = aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
  }
  
  return direction === 'desc' ? -comparison : comparison;
}

export function useAdvancedTableSorting(deals: Deal[]) {
  const [sortConfigs, setSortConfigs] = useState<MultiSortConfig>([]);

  const handleSort = (key: string, isMultiSort = false) => {
    setSortConfigs(prev => {
      if (!isMultiSort) {
        // Single column sort - replace all existing sorts
        const existingConfig = prev.find(config => config.key === key);
        let direction: SortDirection = 'asc';
        
        if (existingConfig) {
          if (existingConfig.direction === 'asc') {
            direction = 'desc';
          } else if (existingConfig.direction === 'desc') {
            direction = null;
          }
        }
        
        return direction ? [{ key, direction }] : [];
      } else {
        // Multi-column sort - add to or modify existing sorts
        const existingIndex = prev.findIndex(config => config.key === key);
        
        if (existingIndex >= 0) {
          // Modify existing sort
          const newConfigs = [...prev];
          const current = newConfigs[existingIndex];
          
          if (current.direction === 'asc') {
            newConfigs[existingIndex] = { key, direction: 'desc' };
          } else if (current.direction === 'desc') {
            // Remove this sort
            newConfigs.splice(existingIndex, 1);
          }
          
          return newConfigs;
        } else {
          // Add new sort
          return [...prev, { key, direction: 'asc' }];
        }
      }
    });
  };

  const clearSort = () => {
    setSortConfigs([]);
  };

  const removeSortColumn = (key: string) => {
    setSortConfigs(prev => prev.filter(config => config.key !== key));
  };

  const sortedDeals = useMemo(() => {
    if (sortConfigs.length === 0) return deals;

    return [...deals].sort((a, b) => {
      // Apply each sort config in order
      for (const { key, direction } of sortConfigs) {
        if (!direction) continue;
        
        const dataType = COLUMN_DATA_TYPES[key as keyof typeof COLUMN_DATA_TYPES] || 'string';
        const aValue = getValueForSorting(a, key, dataType);
        const bValue = getValueForSorting(b, key, dataType);
        
        const comparison = compareValues(aValue, bValue, direction);
        
        if (comparison !== 0) {
          return comparison;
        }
      }
      
      return 0;
    });
  }, [deals, sortConfigs]);

  // Helper to get current sort for a column
  const getSortForColumn = (key: string) => {
    return sortConfigs.find(config => config.key === key) || null;
  };

  // Helper to get sort priority (order) for a column
  const getSortPriority = (key: string): number | null => {
    const index = sortConfigs.findIndex(config => config.key === key);
    return index >= 0 ? index + 1 : null;
  };

  return {
    sortedDeals,
    sortConfigs,
    handleSort,
    clearSort,
    removeSortColumn,
    getSortForColumn,
    getSortPriority,
  };
}
