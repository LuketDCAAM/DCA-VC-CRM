import { useState, useMemo } from 'react';
import { Deal } from '@/types/deal';

export function useQuarterFilter(deals: Deal[]) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');

  // Generate available quarters from deals
  const availableQuarters = useMemo(() => {
    const quarters = new Set<string>();
    
    deals.forEach(deal => {
      const date = deal.source_date ? new Date(deal.source_date) : new Date(deal.created_at);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      quarters.add(`Q${quarter} ${year}`);
    });

    return Array.from(quarters).sort((a, b) => {
      const [qA, yearA] = a.split(' ');
      const [qB, yearB] = b.split(' ');
      if (yearB !== yearA) return parseInt(yearB) - parseInt(yearA);
      return parseInt(qB.substring(1)) - parseInt(qA.substring(1));
    });
  }, [deals]);

  // Filter deals by selected quarter
  const filteredDeals = useMemo(() => {
    if (selectedQuarter === 'all') return deals;

    const [q, year] = selectedQuarter.split(' ');
    const quarterNum = parseInt(q.substring(1));
    const yearNum = parseInt(year);

    return deals.filter(deal => {
      const date = deal.source_date ? new Date(deal.source_date) : new Date(deal.created_at);
      const dealYear = date.getFullYear();
      const dealQuarter = Math.floor(date.getMonth() / 3) + 1;
      
      return dealYear === yearNum && dealQuarter === quarterNum;
    });
  }, [deals, selectedQuarter]);

  return {
    selectedQuarter,
    setSelectedQuarter,
    availableQuarters,
    filteredDeals,
  };
}
