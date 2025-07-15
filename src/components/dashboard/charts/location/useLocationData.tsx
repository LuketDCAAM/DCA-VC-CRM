
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { LocationData, ALL_REGIONS, CITY_TO_REGION } from './LocationDataTypes';

export function useLocationData(filteredDeals: Deal[]): LocationData[] {
  return useMemo(() => {
    const regionCounts: Record<string, { count: number; deals: Deal[]; cities: Set<string> }> = {};
    
    console.log('Processing deals for location grouping:', filteredDeals.length);
    
    filteredDeals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const location = deal.location.trim();
        console.log('Processing location:', location);
        
        let region = CITY_TO_REGION[location];
        
        // If no direct mapping found, try some common variations
        if (!region) {
          // Handle "City, State" format
          const parts = location.split(',').map(part => part.trim());
          if (parts.length === 2) {
            const [city, state] = parts;
            // Try to find the city in our mapping
            region = CITY_TO_REGION[city];
            
            // If still not found, try state variations
            if (!region) {
              // Try the state part directly if it's a known region
              if (ALL_REGIONS[state]) {
                region = state;
              } else {
                // Try common state abbreviation to full name mappings
                const stateMapping: Record<string, string> = {
                  'CA': 'California',
                  'NY': 'New York',
                  'TX': 'Texas',
                  'FL': 'Florida',
                  'IL': 'Illinois',
                  'WA': 'Washington',
                  'MA': 'Massachusetts',
                  'CO': 'Colorado',
                  'GA': 'Georgia',
                  'NC': 'North Carolina',
                  'NV': 'Nevada',
                  'OR': 'Oregon',
                  'AZ': 'Arizona',
                  'UT': 'Utah',
                  'PA': 'Pennsylvania',
                  'OH': 'Ohio',
                  'MI': 'Michigan',
                  'VA': 'Virginia',
                  'MD': 'Maryland',
                  'MN': 'Minnesota',
                  'TN': 'Tennessee',
                  'CT': 'Connecticut',
                  'NJ': 'New Jersey',
                  'WI': 'Wisconsin',
                  'IN': 'Indiana',
                  'MO': 'Missouri',
                  'AL': 'Alabama',
                  'SC': 'South Carolina',
                  'LA': 'Louisiana',
                  'KY': 'Kentucky',
                  'OK': 'Oklahoma',
                };
                region = stateMapping[state] || state;
              }
            }
          }
        }
        
        // If we still don't have a region mapping, check if it's already a known region
        if (!region) {
          if (ALL_REGIONS[location]) {
            region = location;
          } else {
            // For any unmapped location, keep it as-is but log it
            console.log('Unmapped location:', location);
            region = location;
          }
        }
        
        console.log(`Mapped "${location}" to region "${region}"`);
        
        if (!regionCounts[region]) {
          regionCounts[region] = { count: 0, deals: [], cities: new Set() };
        }
        regionCounts[region].count++;
        regionCounts[region].deals.push(deal);
        
        // Add the original location as a city if it was mapped to a different region
        if (CITY_TO_REGION[location] && CITY_TO_REGION[location] === region) {
          regionCounts[region].cities.add(location);
        } else if (location.includes(',')) {
          // For "City, State" format, add just the city part
          const cityPart = location.split(',')[0].trim();
          regionCounts[region].cities.add(cityPart);
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
