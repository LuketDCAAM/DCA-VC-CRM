
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { normalizeLocationToFilterKey } from '@/utils/locationUtils';

export interface FilteredDealsConfig {
  searchTerm: string;
  activeFilters: Record<string, any>;
}

function filterDeals(deals: Deal[], searchTerm: string, activeFilters: Record<string, any>): Deal[] {
  console.log('🔍 FILTERING DEALS:', {
    totalDeals: deals.length,
    searchTerm,
    activeFilters,
  });

  let filtered = deals;

  // Apply search term filter
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(deal => 
      deal.company_name?.toLowerCase().includes(searchLower) ||
      deal.contact_name?.toLowerCase().includes(searchLower) ||
      deal.city?.toLowerCase().includes(searchLower) ||
      deal.state_province?.toLowerCase().includes(searchLower) ||
      deal.country?.toLowerCase().includes(searchLower) ||
      deal.location?.toLowerCase().includes(searchLower) ||
      deal.description?.toLowerCase().includes(searchLower) ||
      deal.sector?.toLowerCase().includes(searchLower) ||
      deal.deal_source?.toLowerCase().includes(searchLower)
    );
  }

  // Apply active filters
  Object.entries(activeFilters).forEach(([key, value]) => {
    if (value && value !== '' && value !== null && value !== undefined) {
      console.log(`Applying filter: ${key} = ${value}`);
      
      switch (key) {
        case 'pipeline_stage':
          if (Array.isArray(value)) {
            filtered = filtered.filter(deal => value.length === 0 || value.includes(deal.pipeline_stage));
          } else {
            filtered = filtered.filter(deal => deal.pipeline_stage === value);
          }
          break;
        case 'round_stage':
          if (Array.isArray(value)) {
            filtered = filtered.filter(deal => value.length === 0 || value.includes(deal.round_stage || ''));
          } else {
            filtered = filtered.filter(deal => deal.round_stage === value);
          }
          break;
        case 'sector':
          if (Array.isArray(value)) {
            filtered = filtered.filter(deal => value.length === 0 || value.includes(deal.sector || ''));
          } else {
            filtered = filtered.filter(deal => deal.sector === value);
          }
          break;
        case 'state_province':
          if (Array.isArray(value)) {
            filtered = filtered.filter(deal => value.length === 0 || value.includes(deal.state_province || ''));
          } else {
            filtered = filtered.filter(deal => deal.state_province === value);
          }
          break;

        case 'country':
          if (Array.isArray(value)) {
            filtered = filtered.filter(deal => value.length === 0 || value.includes(deal.country || ''));
          } else {
            filtered = filtered.filter(deal => deal.country === value);
          }
          break;
        case 'deal_source':
          if (Array.isArray(value)) {
            filtered = filtered.filter(deal => value.length === 0 || value.includes(deal.deal_source || ''));
          } else {
            filtered = filtered.filter(deal => deal.deal_source === value);
          }
          break;
        case 'round_size':
          if (Array.isArray(value) && value.length === 2) {
            filtered = filtered.filter(deal => 
              deal.round_size && 
              deal.round_size >= value[0] && 
              deal.round_size <= value[1]
            );
          }
          break;
        case 'deal_score_min':
          filtered = filtered.filter(deal => 
            deal.deal_score !== null && deal.deal_score !== undefined && 
            deal.deal_score >= Number(value)
          );
          break;
        case 'deal_score_max':
          filtered = filtered.filter(deal => 
            deal.deal_score !== null && deal.deal_score !== undefined && 
            deal.deal_score <= Number(value)
          );
          break;
        case 'created_at_from':
          filtered = filtered.filter(deal => {
            const dealDate = new Date(deal.created_at).toISOString().split('T')[0];
            return dealDate >= value;
          });
          break;
        case 'created_at_to':
          filtered = filtered.filter(deal => {
            const dealDate = new Date(deal.created_at).toISOString().split('T')[0];
            return dealDate <= value;
          });
          break;
        case 'source_date_from':
          filtered = filtered.filter(deal => {
            if (!deal.source_date) return false;
            const dealDate = new Date(deal.source_date).toISOString().split('T')[0];
            return dealDate >= value;
          });
          break;
        case 'source_date_to':
          filtered = filtered.filter(deal => {
            if (!deal.source_date) return false;
            const dealDate = new Date(deal.source_date).toISOString().split('T')[0];
            return dealDate <= value;
          });
          break;
        default:
          break;
      }
    }
  });

  console.log('🔍 FILTERED RESULTS:', {
    originalCount: deals.length,
    filteredCount: filtered.length,
    searchTerm,
    activeFilters,
  });

  return filtered;
}

export function useOptimizedFilteredDeals(
  deals: Deal[], 
  searchTerm: string, 
  activeFilters: Record<string, any>
): Deal[] {
  return useMemo(() => {
    return filterDeals(deals, searchTerm, activeFilters);
  }, [deals, searchTerm, activeFilters]);
}
