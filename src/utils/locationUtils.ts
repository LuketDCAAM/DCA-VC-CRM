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

/**
 * Formats a location from separate components or a location string
 * Examples:
 * - formatLocation({ city: 'San Francisco', state_province: 'California', country: 'USA' }) -> "San Francisco, California, USA"
 * - formatLocation({ state_province: 'Texas', country: 'USA' }) -> "Texas, USA"
 * - formatLocation({ country: 'Germany' }) -> "Germany"
 */
export function formatLocation(
  location: string | null | undefined | { city?: string | null; state_province?: string | null; country?: string | null }
): string {
  // Handle object input (new three-column format)
  if (typeof location === 'object' && location !== null) {
    const parts = [location.city, location.state_province, location.country]
      .filter(Boolean)
      .map(p => p!.trim());
    return parts.join(', ');
  }
  
  // Handle string input (legacy single-column format)
  if (!location || typeof location !== 'string') return '';
  
  const parts = location.split(',').map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 0) return '';
  
  // Expand any state abbreviations in the parts
  const expandedParts = parts.map(part => {
    const upperPart = part.toUpperCase();
    if (STATE_ABBREVIATIONS[upperPart]) {
      return STATE_ABBREVIATIONS[upperPart];
    }
    return part;
  });
  
  return expandedParts.join(', ');
}

/**
 * Normalizes location to state/country level for filtering
 * Handles both object format (new) and string format (legacy)
 * Examples:
 * - { city: 'San Francisco', state_province: 'California', country: 'USA' } -> "California, USA"
 * - { state_province: 'Texas', country: 'USA' } -> "Texas, USA"
 * - "San Francisco, CA, USA" -> "California, USA"
 */
export function normalizeLocationToFilterKey(
  location: string | { city?: string | null; state_province?: string | null; country?: string | null }
): string {
  // Handle object input (new three-column format)
  if (typeof location === 'object' && location !== null) {
    const { state_province, country } = location;
    if (state_province && country) {
      const normalizedCountry = US_ALIASES.has(country) ? 'USA' : country;
      return `${state_province}, ${normalizedCountry}`;
    }
    if (state_province) return state_province;
    if (country) return country;
    return '';
  }
  
  // Handle string input (legacy single-column format)
  if (typeof location !== 'string') return '';
  
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
    return expandStateAbbreviation(parts[0]);
  }
  
  return location;
}
