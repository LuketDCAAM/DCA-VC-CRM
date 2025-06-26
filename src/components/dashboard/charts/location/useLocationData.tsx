
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { LocationData, US_REGIONS, CITY_TO_REGION } from './LocationDataTypes';

export function useLocationData(filteredDeals: Deal[]): LocationData[] {
  return useMemo(() => {
    const regionCounts: Record<string, { count: number; deals: Deal[]; cities: Set<string> }> = {};
    
    filteredDeals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const location = deal.location.trim();
        
        // Try to map city to region, or use location as-is
        const region = CITY_TO_REGION[location] || location;
        
        if (!regionCounts[region]) {
          regionCounts[region] = { count: 0, deals: [], cities: new Set() };
        }
        regionCounts[region].count++;
        regionCounts[region].deals.push(deal);
        regionCounts[region].cities.add(location);
      }
    });

    return Object.entries(regionCounts)
      .map(([region, data]) => ({
        region,
        count: data.count,
        deals: data.deals,
        cities: Array.from(data.cities),
        regionInfo: US_REGIONS[region] || null
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredDeals]);
}
