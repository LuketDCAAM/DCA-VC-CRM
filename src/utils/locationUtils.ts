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
 * Formats a location string by expanding state abbreviations
 * Examples:
 * - "San Francisco, CA, USA" -> "San Francisco, California, USA"
 * - "Phoenix, AZ" -> "Phoenix, Arizona"
 * - "NY" -> "New York"
 */
export function formatLocation(location: string | null | undefined): string {
  if (!location) return '';
  
  const parts = location.split(',').map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 0) return '';
  
  // Expand any state abbreviations in the parts
  const expandedParts = parts.map(part => {
    const upperPart = part.toUpperCase();
    // Check if this is a standalone state abbreviation or part of the location
    if (STATE_ABBREVIATIONS[upperPart]) {
      return STATE_ABBREVIATIONS[upperPart];
    }
    return part;
  });
  
  return expandedParts.join(', ');
}

/**
 * Normalizes location to state/country level for filtering
 * Examples:
 * - "San Francisco, CA, USA" -> "California, USA"
 * - "Phoenix, AZ" -> "Arizona"
 * - "London, UK" -> "UK"
 */
export function normalizeLocationToFilterKey(location: string): string {
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
