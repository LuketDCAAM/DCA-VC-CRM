
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { useDebouncedSearch } from './useDebounce';

// Move filter logic to separate functions for better performance
const createSearchMatcher = (searchTerm: string) => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return (deal: Deal) => 
    deal.company_name.toLowerCase().includes(lowerSearchTerm) ||
    (deal.contact_name?.toLowerCase().includes(lowerSearchTerm)) ||
    (deal.location?.toLowerCase().includes(lowerSearchTerm)) ||
    (deal.description?.toLowerCase().includes(lowerSearchTerm)) ||
    (deal.deal_lead?.toLowerCase().includes(lowerSearchTerm)) ||
    (deal.deal_source?.toLowerCase().includes(lowerSearchTerm));
};

const createFilterMatcher = (activeFilters: Record<string, any>) => {
  const filterEntries = Object.entries(activeFilters).filter(([key, value]) => 
    value && value !== 'all' && value !== ''
  );
  
  if (filterEntries.length === 0) return () => true;
  
  return (deal: Deal) => {
    for (const [key, value] of filterEntries) {
      switch (key) {
        case 'created_at':
          const dealDate = new Date(deal.created_at).toISOString().split('T')[0];
          if (dealDate < value) return false;
          break;
          
        case 'source_date':
          if (!deal.source_date) return false;
          const sourceDateValue = new Date(deal.source_date).toISOString().split('T')[0];
          if (sourceDateValue < value) return false;
          break;
          
        case 'round_size_min':
          if (!deal.round_size || deal.round_size < parseInt(value, 10) * 100) return false;
          break;
          
        case 'round_size_max':
          if (!deal.round_size || deal.round_size > parseInt(value, 10) * 100) return false;
          break;

        case 'deal_score_min':
          if (typeof deal.deal_score !== 'number' || deal.deal_score < parseInt(value, 10)) return false;
          break;
          
        case 'deal_score_max':
          if (typeof deal.deal_score !== 'number' || deal.deal_score > parseInt(value, 10)) return false;
          break;
          
        default:
          if (deal[key as keyof Deal] !== value) return false;
      }
    }
    return true;
  };
};

export function useOptimizedFilteredDeals(deals: Deal[], searchTerm: string, activeFilters: Record<string, any>) {
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, 300);
  
  // Memoize search and filter functions
  const searchMatcher = useMemo(() => 
    debouncedSearchTerm ? createSearchMatcher(debouncedSearchTerm) : null,
    [debouncedSearchTerm]
  );
  
  const filterMatcher = useMemo(() => 
    createFilterMatcher(activeFilters),
    [activeFilters]
  );
  
  const filteredDeals = useMemo(() => {
    if (!deals.length) return [];

    return deals.filter(deal => {
      // Apply search filter first (most likely to filter out items)
      if (searchMatcher && !searchMatcher(deal)) return false;
      // Apply other filters
      return filterMatcher(deal);
    });
  }, [deals, searchMatcher, filterMatcher]);

  return filteredDeals;
}
