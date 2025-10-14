
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { LocationData, ALL_REGIONS } from './LocationDataTypes';

export function useLocationData(filteredDeals: Deal[]): LocationData[] {
  return useMemo(() => {
    const regionCounts: Record<string, { count: number; deals: Deal[]; cities: Set<string> }> = {};
    
    console.log('Processing deals for location grouping:', filteredDeals.length);
    
    filteredDeals.forEach(deal => {
      // Use new structured location fields
      let region = '';
      
      if (deal.country) {
        // For US deals, use state as region
        if (deal.country === 'USA' && deal.state_province) {
          region = deal.state_province;
        } else {
          // For international deals, use country as region
          region = deal.country;
        }
      } else if (deal.state_province) {
        // If only state is available, use it
        region = deal.state_province;
      }
      
      if (region) {
        console.log(`Processing deal "${deal.company_name}" -> region: "${region}"`);
        
        if (!regionCounts[region]) {
          regionCounts[region] = { count: 0, deals: [], cities: new Set() };
        }
        
        regionCounts[region].count++;
        regionCounts[region].deals.push(deal);
        
        // Add city if available
        if (deal.city) {
          regionCounts[region].cities.add(deal.city);
        }
      }
    });

    const result = Object.entries(regionCounts)
      .map(([region, data]) => ({
        region,
        count: data.count,
        deals: data.deals,
        cities: Array.from(data.cities),
        regionInfo: ALL_REGIONS[region] || null
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log('Final location data:', result);
    return result;
  }, [filteredDeals]);
}

// Export the quality report hook for debugging
export function useLocationQualityReport(deals: Deal[]) {
  return useMemo(() => {
    const total = deals.length;
    const withCountry = deals.filter(d => d.country).length;
    const withState = deals.filter(d => d.state_province).length;
    const withCity = deals.filter(d => d.city).length;
    
    return {
      total,
      withCountry,
      withState,
      withCity,
      withCompleteLocation: deals.filter(d => d.city && d.state_province && d.country).length,
      missingLocation: deals.filter(d => !d.city && !d.state_province && !d.country).length
    };
  }, [deals]);
}
