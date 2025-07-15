
import { Deal } from '@/types/deal';
import { 
  ALL_REGIONS, 
  CITY_TO_REGION, 
  LOCATION_ALIASES, 
  STATE_ABBREVIATIONS 
} from './LocationDataTypes';

export interface ProcessedLocation {
  originalLocation: string;
  normalizedLocation: string;
  region: string;
  confidence: 'high' | 'medium' | 'low';
  type: 'city' | 'state' | 'country' | 'region' | 'unknown';
}

export class LocationDataProcessor {
  private static normalizeLocationString(location: string): string {
    return location
      .trim()
      .replace(/[.,]/g, ' ') // Replace commas and periods with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\b(USA|US|United States)\b/gi, '') // Remove country references
      .replace(/\b(Inc|LLC|Corp|Corporation|Ltd|Limited)\b/gi, '') // Remove business suffixes
      .trim();
  }

  private static extractLocationParts(location: string): string[] {
    const normalized = this.normalizeLocationString(location);
    return normalized.split(/[,;]/)
      .map(part => part.trim())
      .filter(part => part.length > 0);
  }

  private static findBestMatch(locationPart: string): { region: string; confidence: 'high' | 'medium' | 'low'; type: string } | null {
    const cleanPart = locationPart.trim();
    
    // Check aliases first
    if (LOCATION_ALIASES[cleanPart]) {
      const aliasedLocation = LOCATION_ALIASES[cleanPart];
      const region = CITY_TO_REGION[aliasedLocation];
      if (region) {
        return { region, confidence: 'high', type: 'city' };
      }
    }
    
    // Direct city match
    if (CITY_TO_REGION[cleanPart]) {
      return { region: CITY_TO_REGION[cleanPart], confidence: 'high', type: 'city' };
    }
    
    // Direct region match
    if (ALL_REGIONS[cleanPart]) {
      return { region: cleanPart, confidence: 'high', type: 'region' };
    }
    
    // State abbreviation match
    if (STATE_ABBREVIATIONS[cleanPart.toUpperCase()]) {
      const stateName = STATE_ABBREVIATIONS[cleanPart.toUpperCase()];
      if (ALL_REGIONS[stateName]) {
        return { region: stateName, confidence: 'high', type: 'state' };
      }
    }
    
    // Fuzzy matching for cities (case-insensitive)
    const lowerPart = cleanPart.toLowerCase();
    for (const [city, region] of Object.entries(CITY_TO_REGION)) {
      if (city.toLowerCase() === lowerPart) {
        return { region, confidence: 'high', type: 'city' };
      }
    }
    
    // Partial matching for cities
    for (const [city, region] of Object.entries(CITY_TO_REGION)) {
      if (city.toLowerCase().includes(lowerPart) || lowerPart.includes(city.toLowerCase())) {
        if (city.length >= 4 && cleanPart.length >= 4) { // Avoid matching very short strings
          return { region, confidence: 'medium', type: 'city' };
        }
      }
    }
    
    // Partial matching for regions
    for (const regionName of Object.keys(ALL_REGIONS)) {
      if (regionName.toLowerCase().includes(lowerPart) || lowerPart.includes(regionName.toLowerCase())) {
        if (regionName.length >= 4 && cleanPart.length >= 4) {
          return { region: regionName, confidence: 'medium', type: 'region' };
        }
      }
    }
    
    return null;
  }

  static processLocation(location: string): ProcessedLocation {
    if (!location || location.trim() === '') {
      return {
        originalLocation: location,
        normalizedLocation: '',
        region: 'Unknown',
        confidence: 'low',
        type: 'unknown'
      };
    }

    const parts = this.extractLocationParts(location);
    let bestMatch: { region: string; confidence: 'high' | 'medium' | 'low'; type: string } | null = null;
    
    // Try to find the best match from all parts
    for (const part of parts) {
      if (part.length < 2) continue; // Skip very short parts
      
      const match = this.findBestMatch(part);
      if (match) {
        if (!bestMatch || match.confidence === 'high' || 
           (bestMatch.confidence !== 'high' && match.confidence === 'medium')) {
          bestMatch = match;
        }
      }
    }
    
    if (bestMatch) {
      return {
        originalLocation: location,
        normalizedLocation: parts.join(', '),
        region: bestMatch.region,
        confidence: bestMatch.confidence,
        type: bestMatch.type
      };
    }
    
    // If no match found, try with the full location string
    const fullMatch = this.findBestMatch(location);
    if (fullMatch) {
      return {
        originalLocation: location,
        normalizedLocation: this.normalizeLocationString(location),
        region: fullMatch.region,
        confidence: fullMatch.confidence,
        type: fullMatch.type
      };
    }
    
    return {
      originalLocation: location,
      normalizedLocation: this.normalizeLocationString(location),
      region: 'Other',
      confidence: 'low',
      type: 'unknown'
    };
  }

  static getLocationQualityReport(deals: Deal[]): {
    totalDeals: number;
    mappedDeals: number;
    unmappedDeals: number;
    highConfidenceDeals: number;
    mediumConfidenceDeals: number;
    lowConfidenceDeals: number;
    unmappedLocations: string[];
    duplicateLocations: Array<{ location: string; count: number; mappedTo: string[] }>;
  } {
    const locationCounts: Record<string, number> = {};
    const locationMappings: Record<string, Set<string>> = {};
    const unmappedLocations: string[] = [];
    let highConfidence = 0;
    let mediumConfidence = 0;
    let lowConfidence = 0;
    let mapped = 0;
    
    deals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const location = deal.location.trim();
        locationCounts[location] = (locationCounts[location] || 0) + 1;
        
        const processed = this.processLocation(location);
        
        if (processed.region !== 'Unknown' && processed.region !== 'Other') {
          mapped++;
          
          if (!locationMappings[location]) {
            locationMappings[location] = new Set();
          }
          locationMappings[location].add(processed.region);
          
          switch (processed.confidence) {
            case 'high':
              highConfidence++;
              break;
            case 'medium':
              mediumConfidence++;
              break;
            case 'low':
              lowConfidence++;
              break;
          }
        } else {
          unmappedLocations.push(location);
        }
      }
    });
    
    // Find duplicate mappings
    const duplicateLocations = Object.entries(locationMappings)
      .filter(([_, regions]) => regions.size > 1)
      .map(([location, regions]) => ({
        location,
        count: locationCounts[location],
        mappedTo: Array.from(regions)
      }));
    
    return {
      totalDeals: deals.filter(d => d.location && d.location.trim() !== '').length,
      mappedDeals: mapped,
      unmappedDeals: unmappedLocations.length,
      highConfidenceDeals: highConfidence,
      mediumConfidenceDeals: mediumConfidence,
      lowConfidenceDeals: lowConfidence,
      unmappedLocations: [...new Set(unmappedLocations)],
      duplicateLocations
    };
  }
}
