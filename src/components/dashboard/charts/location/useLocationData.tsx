import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { LocationData, US_REGIONS, CITY_TO_REGION } from './LocationDataTypes';

export function useLocationData(filteredDeals: Deal[]): LocationData[] {
  return useMemo(() => {
    const regionCounts: Record<string, { count: number; deals: Deal[]; cities: Set<string> }> = {};
    
    filteredDeals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const location = deal.location.trim();
        
        // Always try to map to region first, then fallback to location as-is for unknown locations
        let region = CITY_TO_REGION[location];
        
        // If no direct mapping found, check if it's already a state/country
        if (!region) {
          // Check if the location itself is a known region
          if (US_REGIONS[location]) {
            region = location;
          } else {
            // For unknown locations, keep as-is but they'll be treated as regions
            region = location;
          }
        }
        
        if (!regionCounts[region]) {
          regionCounts[region] = { count: 0, deals: [], cities: new Set() };
        }
        regionCounts[region].count++;
        regionCounts[region].deals.push(deal);
        
        // Only add to cities if it's actually a city mapping to a region
        if (CITY_TO_REGION[location] && CITY_TO_REGION[location] === region) {
          regionCounts[region].cities.add(location);
        }
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
