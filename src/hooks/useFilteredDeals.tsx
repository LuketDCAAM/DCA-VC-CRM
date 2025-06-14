
import { useMemo } from 'react';
import { Deal } from '@/types/deal';

export function useFilteredDeals(deals: Deal[], searchTerm: string, activeFilters: Record<string, any>) {
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.contact_name && deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (deal.location && deal.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (deal.description && deal.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (deal.deal_lead && deal.deal_lead.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (deal.deal_source && deal.deal_source.toLowerCase().includes(searchTerm.toLowerCase()));

      // Active filters
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === 'all' || value === '') return true;
        
        if (key === 'created_at') {
          const dealDate = new Date(deal.created_at).toISOString().split('T')[0];
          return dealDate >= value;
        }

        if (key === 'source_date') {
          if (!deal.source_date) return false;
          const dealDate = new Date(deal.source_date).toISOString().split('T')[0];
          return dealDate >= value;
        }
        
        if (key === 'round_size_min') {
          return !deal.round_size || deal.round_size >= parseInt(value, 10) * 100;
        }
        
        if (key === 'round_size_max') {
          return !deal.round_size || deal.round_size <= parseInt(value, 10) * 100;
        }

        if (key === 'deal_score_min') {
          return typeof deal.deal_score !== 'number' || deal.deal_score >= parseInt(value, 10);
        }
        
        if (key === 'deal_score_max') {
          return typeof deal.deal_score !== 'number' || deal.deal_score <= parseInt(value, 10);
        }
        
        return deal[key as keyof Deal] === value;
      });

      return matchesSearch && matchesFilters;
    });
  }, [deals, searchTerm, activeFilters]);

  return filteredDeals;
}
