
import { Deal } from '@/types/deal';

const US_ALIASES = new Set<string>(['USA','US','United States','United States of America','U.S.','U.S.A.']);

const STATE_ABBREVIATIONS: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

function expandStateAbbreviation(state: string): string {
  const upperState = state.trim().toUpperCase();
  return STATE_ABBREVIATIONS[upperState] || state;
}

function normalizeLocationDisplay(location: string): string {
  const parts = location.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const country = parts[2];
    if (US_ALIASES.has(country)) {
      const state = expandStateAbbreviation(parts[1]);
      return `${state}, USA`;
    }
    return parts[2];
  } else if (parts.length === 2) {
    const country = parts[1];
    if (US_ALIASES.has(country)) {
      const state = expandStateAbbreviation(parts[0]);
      return `${state}, USA`;
    }
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return location;
}

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
    if (deal.location && deal.location.trim() !== '') {
      const normalized = normalizeLocationDisplay(deal.location.trim());
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
