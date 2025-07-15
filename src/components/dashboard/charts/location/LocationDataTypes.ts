
import { Deal } from '@/types/deal';

export interface RegionInfo {
  name: string;
  coords: [number, number];
  abbr: string;
}

export interface LocationData {
  region: string;
  count: number;
  deals: Deal[];
  cities: string[];
  regionInfo: RegionInfo | null;
}

export const US_REGIONS: Record<string, RegionInfo> = {
  'California': { name: 'California', coords: [36.7783, -119.4179], abbr: 'CA' },
  'New York': { name: 'New York', coords: [40.7128, -74.0060], abbr: 'NY' },
  'Texas': { name: 'Texas', coords: [31.9686, -99.9018], abbr: 'TX' },
  'Florida': { name: 'Florida', coords: [27.7663, -82.6404], abbr: 'FL' },
  'Illinois': { name: 'Illinois', coords: [40.3363, -89.0022], abbr: 'IL' },
  'Washington': { name: 'Washington', coords: [47.7511, -120.7401], abbr: 'WA' },
  'Massachusetts': { name: 'Massachusetts', coords: [42.2352, -71.0275], abbr: 'MA' },
  'Colorado': { name: 'Colorado', coords: [39.0598, -105.3111], abbr: 'CO' },
  'Georgia': { name: 'Georgia', coords: [33.0406, -83.6431], abbr: 'GA' },
  'North Carolina': { name: 'North Carolina', coords: [35.5397, -79.8431], abbr: 'NC' },
  'Nevada': { name: 'Nevada', coords: [38.8026, -116.4194], abbr: 'NV' },
  'Oregon': { name: 'Oregon', coords: [43.8041, -120.5542], abbr: 'OR' },
  'Arizona': { name: 'Arizona', coords: [34.0489, -111.0937], abbr: 'AZ' },
  'Utah': { name: 'Utah', coords: [39.3210, -111.0937], abbr: 'UT' },
  'Pennsylvania': { name: 'Pennsylvania', coords: [41.2033, -77.1945], abbr: 'PA' },
  'Ohio': { name: 'Ohio', coords: [40.4173, -82.9071], abbr: 'OH' },
  'Michigan': { name: 'Michigan', coords: [44.3148, -85.6024], abbr: 'MI' },
  'Virginia': { name: 'Virginia', coords: [37.4316, -78.6569], abbr: 'VA' },
  'Maryland': { name: 'Maryland', coords: [39.0458, -76.6413], abbr: 'MD' },
  'Minnesota': { name: 'Minnesota', coords: [46.7296, -94.6859], abbr: 'MN' },
  'Tennessee': { name: 'Tennessee', coords: [35.5175, -86.5804], abbr: 'TN' },
  'Connecticut': { name: 'Connecticut', coords: [41.6032, -73.0877], abbr: 'CT' },
  'New Jersey': { name: 'New Jersey', coords: [40.0583, -74.4057], abbr: 'NJ' },
  'Wisconsin': { name: 'Wisconsin', coords: [43.7844, -88.7879], abbr: 'WI' },
  'Indiana': { name: 'Indiana', coords: [40.2732, -86.1349], abbr: 'IN' },
  'Missouri': { name: 'Missouri', coords: [37.9643, -91.8318], abbr: 'MO' },
  'Alabama': { name: 'Alabama', coords: [32.3617, -86.2792], abbr: 'AL' },
  'South Carolina': { name: 'South Carolina', coords: [33.8361, -81.1637], abbr: 'SC' },
  'Louisiana': { name: 'Louisiana', coords: [31.2449, -92.1450], abbr: 'LA' },
  'Kentucky': { name: 'Kentucky', coords: [37.8393, -84.2700], abbr: 'KY' },
};

export const CITY_TO_REGION: Record<string, string> = {
  // California cities
  'San Francisco': 'California',
  'Los Angeles': 'California',
  'San Diego': 'California',
  'Sacramento': 'California',
  'San Jose': 'California',
  'Oakland': 'California',
  'Fremont': 'California',
  'Santa Clara': 'California',
  'Palo Alto': 'California',
  'Mountain View': 'California',
  'Cupertino': 'California',
  'Sunnyvale': 'California',
  'Santa Monica': 'California',
  'Long Beach': 'California',
  'Irvine': 'California',
  'Anaheim': 'California',
  'Berkeley': 'California',
  'Pasadena': 'California',
  'Redwood City': 'California',
  'Menlo Park': 'California',
  
  // New York cities
  'New York': 'New York',
  'Brooklyn': 'New York',
  'Manhattan': 'New York',
  'Queens': 'New York',
  'Bronx': 'New York',
  'Staten Island': 'New York',
  'Buffalo': 'New York',
  'Rochester': 'New York',
  'Syracuse': 'New York',
  'Albany': 'New York',
  
  // Texas cities
  'Austin': 'Texas',
  'Houston': 'Texas',
  'Dallas': 'Texas',
  'San Antonio': 'Texas',
  'Fort Worth': 'Texas',
  'El Paso': 'Texas',
  'Arlington': 'Texas',
  'Corpus Christi': 'Texas',
  'Plano': 'Texas',
  'Lubbock': 'Texas',
  
  // Florida cities
  'Miami': 'Florida',
  'Orlando': 'Florida',
  'Tampa': 'Florida',
  'Jacksonville': 'Florida',
  'Fort Lauderdale': 'Florida',
  'St. Petersburg': 'Florida',
  'Tallahassee': 'Florida',
  'Gainesville': 'Florida',
  'Clearwater': 'Florida',
  'West Palm Beach': 'Florida',
  
  // Illinois cities
  'Chicago': 'Illinois',
  'Aurora': 'Illinois',
  'Rockford': 'Illinois',
  'Joliet': 'Illinois',
  'Naperville': 'Illinois',
  'Springfield': 'Illinois',
  'Peoria': 'Illinois',
  'Elgin': 'Illinois',
  
  // Washington cities
  'Seattle': 'Washington',
  'Spokane': 'Washington',
  'Tacoma': 'Washington',
  'Vancouver': 'Washington',
  'Bellevue': 'Washington',
  'Everett': 'Washington',
  'Kent': 'Washington',
  'Renton': 'Washington',
  'Redmond': 'Washington',
  
  // Massachusetts cities
  'Boston': 'Massachusetts',
  'Worcester': 'Massachusetts',
  'Springfield': 'Massachusetts',
  'Lowell': 'Massachusetts',
  'Cambridge': 'Massachusetts',
  'New Bedford': 'Massachusetts',
  'Brockton': 'Massachusetts',
  'Quincy': 'Massachusetts',
  
  // Colorado cities
  'Denver': 'Colorado',
  'Colorado Springs': 'Colorado',
  'Aurora': 'Colorado',
  'Fort Collins': 'Colorado',
  'Lakewood': 'Colorado',
  'Thornton': 'Colorado',
  'Arvada': 'Colorado',
  'Boulder': 'Colorado',
  
  // Georgia cities
  'Atlanta': 'Georgia',
  'Columbus': 'Georgia',
  'Augusta': 'Georgia',
  'Savannah': 'Georgia',
  'Athens': 'Georgia',
  'Sandy Springs': 'Georgia',
  'Roswell': 'Georgia',
  'Macon': 'Georgia',
  
  // North Carolina cities
  'Raleigh': 'North Carolina',
  'Charlotte': 'North Carolina',
  'Greensboro': 'North Carolina',
  'Durham': 'North Carolina',
  'Winston-Salem': 'North Carolina',
  'Fayetteville': 'North Carolina',
  'Cary': 'North Carolina',
  'Wilmington': 'North Carolina',
  
  // Additional major cities
  'Las Vegas': 'Nevada',
  'Henderson': 'Nevada',
  'Portland': 'Oregon',
  'Phoenix': 'Arizona',
  'Tucson': 'Arizona',
  'Salt Lake City': 'Utah',
  'Philadelphia': 'Pennsylvania',
  'Pittsburgh': 'Pennsylvania',
  'Columbus': 'Ohio',
  'Cleveland': 'Ohio',
  'Cincinnati': 'Ohio',
  'Detroit': 'Michigan',
  'Grand Rapids': 'Michigan',
  'Virginia Beach': 'Virginia',
  'Norfolk': 'Virginia',
  'Richmond': 'Virginia',
  'Baltimore': 'Maryland',
  'Minneapolis': 'Minnesota',
  'St. Paul': 'Minnesota',
  'Nashville': 'Tennessee',
  'Memphis': 'Tennessee',
  'Hartford': 'Connecticut',
  'Newark': 'New Jersey',
  'Jersey City': 'New Jersey',
  'Milwaukee': 'Wisconsin',
  'Indianapolis': 'Indiana',
  'Kansas City': 'Missouri',
  'St. Louis': 'Missouri',
  'Birmingham': 'Alabama',
  'Charleston': 'South Carolina',
  'New Orleans': 'Louisiana',
  'Louisville': 'Kentucky',
};
