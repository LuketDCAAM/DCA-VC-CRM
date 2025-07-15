
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { LocationData, ALL_REGIONS } from './LocationDataTypes';
import { LocationDataProcessor } from './LocationDataProcessor';

export function useLocationData(filteredDeals: Deal[]): LocationData[] {
  return useMemo(() => {
    const regionCounts: Record<string, { count: number; deals: Deal[]; cities: Set<string> }> = {};
    
    console.log('Processing deals for location grouping with improved data quality:', filteredDeals.length);
    
    filteredDeals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const processed = LocationDataProcessor.processLocation(deal.location);
        const region = processed.region;
        
        console.log(`Processed "${deal.location}" -> "${region}" (confidence: ${processed.confidence})`);
        
        if (!regionCounts[region]) {
          regionCounts[region] = { count: 0, deals: [], cities: new Set() };
        }
        
        regionCounts[region].count++;
        regionCounts[region].deals.push(deal);
        
        // Add the original location as a city if it was successfully mapped
        if (processed.confidence !== 'low' && processed.type === 'city') {
          regionCounts[region].cities.add(deal.location.split(',')[0].trim());
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
    
    console.log('Final location data with improved quality:', result);
    return result;
  }, [filteredDeals]);
}

// Export the quality report hook for debugging
export function useLocationQualityReport(deals: Deal[]) {
  return useMemo(() => {
    return LocationDataProcessor.getLocationQualityReport(deals);
  }, [deals]);
}
