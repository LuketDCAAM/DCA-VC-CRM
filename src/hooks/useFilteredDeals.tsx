
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { useDebouncedSearch } from './useDebounce';
import { normalizeLocationToFilterKey } from '@/utils/locationUtils';

export function useFilteredDeals(deals: Deal[], searchTerm: string, activeFilters: Record<string, any>) {
  const debouncedSearchTerm = useDebouncedSearch(searchTerm, 300);
  
  const filteredDeals = useMemo(() => {
    // Early return if no deals
    if (!deals.length) return [];

    return deals.filter(deal => {
      // Search filter with debounced term
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !debouncedSearchTerm || 
        deal.company_name.toLowerCase().includes(searchLower) ||
        (deal.contact_name && deal.contact_name.toLowerCase().includes(searchLower)) ||
        (deal.city && deal.city.toLowerCase().includes(searchLower)) ||
        (deal.state_province && deal.state_province.toLowerCase().includes(searchLower)) ||
        (deal.country && deal.country.toLowerCase().includes(searchLower)) ||
        (deal.location && deal.location.toLowerCase().includes(searchLower)) ||
        (deal.description && deal.description.toLowerCase().includes(searchLower)) ||
        (deal.deal_lead && deal.deal_lead.toLowerCase().includes(searchLower)) ||
        (deal.deal_source && deal.deal_source.toLowerCase().includes(searchLower));

      // Active filters - optimized with early returns
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === 'all' || value === '') return true;
        
        switch (key) {
          case 'created_at_from':
            const dealDateFrom = new Date(deal.created_at).toISOString().split('T')[0];
            return dealDateFrom >= value;
          
          case 'created_at_to':
            const dealDateTo = new Date(deal.created_at).toISOString().split('T')[0];
            return dealDateTo <= value;
            
          case 'source_date_from':
            if (!deal.source_date) return false;
            const sourceDateFromValue = new Date(deal.source_date).toISOString().split('T')[0];
            return sourceDateFromValue >= value;
          
          case 'source_date_to':
            if (!deal.source_date) return false;
            const sourceDateToValue = new Date(deal.source_date).toISOString().split('T')[0];
            return sourceDateToValue <= value;
            
          case 'round_size_min':
            return !deal.round_size || deal.round_size >= parseInt(value, 10) * 100;
            
          case 'round_size_max':
            return !deal.round_size || deal.round_size <= parseInt(value, 10) * 100;

          case 'deal_score_min':
            return typeof deal.deal_score !== 'number' || deal.deal_score >= parseInt(value, 10);
            
          case 'deal_score_max':
            return typeof deal.deal_score !== 'number' || deal.deal_score <= parseInt(value, 10);
          
          case 'state_province':
            if (Array.isArray(value)) {
              return value.length === 0 || value.includes(deal.state_province || '');
            }
            return deal.state_province === value;

          case 'country':
            if (Array.isArray(value)) {
              return value.length === 0 || value.includes(deal.country || '');
            }
            return deal.country === value;

          case 'call_with_founder':
            if (value === 'yes') {
              return deal.last_call_date !== null || (deal.total_calls !== null && deal.total_calls > 0);
            } else if (value === 'no') {
              return deal.last_call_date === null && (deal.total_calls === null || deal.total_calls === 0);
            }
            return true;

          case 'has_scorecard':
            if (value === 'yes') {
              return deal.deal_score !== null;
            } else if (value === 'no') {
              return deal.deal_score === null;
            }
            return true;
            
          default:
            // Handle array values for multi-select filters
            if (Array.isArray(value)) {
              return value.length === 0 || value.includes(deal[key as keyof Deal] as string);
            }
            return deal[key as keyof Deal] === value;
        }
      });

      return matchesSearch && matchesFilters;
    });
  }, [deals, debouncedSearchTerm, activeFilters]);

  return filteredDeals;
}
