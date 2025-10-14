
import { Deal } from '@/types/deal';
import { normalizeLocationToFilterKey } from './locationUtils';

export function getUniqueSectors(deals: Deal[]): { label: string; value: string }[] {
  console.log('Extracting unique sectors from deals:', deals.length);
  
  const sectorSet = new Set<string>();
  
  deals.forEach(deal => {
    if (deal.sector && deal.sector.trim() !== '') {
      sectorSet.add(deal.sector.trim());
    }
  });
  
  const uniqueSectors = Array.from(sectorSet)
    .sort()
    .map(sector => ({
      label: sector,
      value: sector
    }));
  
  console.log('Unique sectors found:', uniqueSectors);
  return uniqueSectors;
}

export function getUniqueLocations(deals: Deal[]): { label: string; value: string }[] {
  console.log('Extracting unique locations from deals:', deals.length);
  
  const locationSet = new Set<string>();
  
  deals.forEach(deal => {
    // Try new three-column format first
    if (deal.city || deal.state_province || deal.country) {
      const normalized = normalizeLocationToFilterKey({
        city: deal.city,
        state_province: deal.state_province,
        country: deal.country
      });
      if (normalized) locationSet.add(normalized);
    }
    // Fall back to legacy location field
    else if (deal.location && deal.location.trim() !== '') {
      const normalized = normalizeLocationToFilterKey(deal.location.trim());
      locationSet.add(normalized);
    }
  });
  
  const uniqueLocations = Array.from(locationSet)
    .sort()
    .map(location => ({
      label: location,
      value: location
    }));
  
  console.log('Unique locations found:', uniqueLocations);
  return uniqueLocations;
}

export function getUniqueDealSources(deals: Deal[]): { label: string; value: string }[] {
  console.log('Extracting unique deal sources from deals:', deals.length);
  
  const sourceSet = new Set<string>();
  
  deals.forEach(deal => {
    if (deal.deal_source && deal.deal_source.trim() !== '') {
      sourceSet.add(deal.deal_source.trim());
    }
  });
  
  const uniqueSources = Array.from(sourceSet)
    .sort()
    .map(source => ({
      label: source,
      value: source
    }));
  
  console.log('Unique deal sources found:', uniqueSources);
  return uniqueSources;
}
