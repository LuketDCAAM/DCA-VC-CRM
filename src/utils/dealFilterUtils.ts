
import { Deal } from '@/types/deal';
import { splitSectors } from '@/utils/sectorUtils';

export function getUniqueSectors(deals: Deal[]): { label: string; value: string }[] {
  const sectorSet = new Set<string>();

  deals.forEach(deal => {
    splitSectors(deal.sector).forEach(tag => sectorSet.add(tag));
  });

  return Array.from(sectorSet)
    .sort((a, b) => a.localeCompare(b))
    .map(sector => ({ label: sector, value: sector }));
}

export function getUniqueStateProvinces(deals: Deal[]): { label: string; value: string }[] {
  console.log('Extracting unique states/provinces from deals:', deals.length);
  
  const stateSet = new Set<string>();
  
  deals.forEach(deal => {
    if (deal.state_province && deal.state_province.trim() !== '') {
      stateSet.add(deal.state_province.trim());
    }
  });
  
  const uniqueStates = Array.from(stateSet)
    .sort()
    .map(state => ({
      label: state,
      value: state
    }));
  
  console.log('Unique states/provinces found:', uniqueStates);
  return uniqueStates;
}

export function getUniqueCountries(deals: Deal[]): { label: string; value: string }[] {
  console.log('Extracting unique countries from deals:', deals.length);
  
  const countrySet = new Set<string>();
  
  deals.forEach(deal => {
    if (deal.country && deal.country.trim() !== '') {
      countrySet.add(deal.country.trim());
    }
  });
  
  const uniqueCountries = Array.from(countrySet)
    .sort()
    .map(country => ({
      label: country,
      value: country
    }));
  
  console.log('Unique countries found:', uniqueCountries);
  return uniqueCountries;
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

export function getUniqueDealLeads(deals: Deal[]): { label: string; value: string }[] {
  const leadSet = new Set<string>();

  deals.forEach(deal => {
    if (deal.sourced_by && deal.sourced_by.trim() !== '') {
      leadSet.add(deal.sourced_by.trim());
    }
  });

  return Array.from(leadSet)
    .sort()
    .map(lead => ({ label: lead, value: lead }));
}
