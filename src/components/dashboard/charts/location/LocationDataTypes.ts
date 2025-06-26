
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
};

export const CITY_TO_REGION: Record<string, string> = {
  'San Francisco': 'California',
  'Los Angeles': 'California',
  'San Diego': 'California',
  'Sacramento': 'California',
  'San Jose': 'California',
  'New York': 'New York',
  'Brooklyn': 'New York',
  'Manhattan': 'New York',
  'Austin': 'Texas',
  'Houston': 'Texas',
  'Dallas': 'Texas',
  'Miami': 'Florida',
  'Orlando': 'Florida',
  'Tampa': 'Florida',
  'Chicago': 'Illinois',
  'Seattle': 'Washington',
  'Boston': 'Massachusetts',
  'Denver': 'Colorado',
  'Atlanta': 'Georgia',
  'Raleigh': 'North Carolina',
  'Charlotte': 'North Carolina',
};
