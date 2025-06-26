
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, TrendingUp } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealsLocationMapProps {
  deals: Deal[];
}

// US state coordinates for better visualization
const US_REGIONS = {
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

// City mappings to states/regions
const CITY_TO_REGION: Record<string, string> = {
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

export function DealsLocationMap({ deals }: DealsLocationMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const locationData = useMemo(() => {
    const regionCounts: Record<string, { count: number; deals: Deal[]; cities: Set<string> }> = {};
    
    deals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const location = deal.location.trim();
        
        // Try to map city to region, or use location as-is
        const region = CITY_TO_REGION[location] || location;
        
        if (!regionCounts[region]) {
          regionCounts[region] = { count: 0, deals: [], cities: new Set() };
        }
        regionCounts[region].count++;
        regionCounts[region].deals.push(deal);
        regionCounts[region].cities.add(location);
      }
    });

    return Object.entries(regionCounts)
      .map(([region, data]) => ({
        region,
        count: data.count,
        deals: data.deals,
        cities: Array.from(data.cities),
        regionInfo: US_REGIONS[region] || null
      }))
      .sort((a, b) => b.count - a.count);
  }, [deals]);

  const totalDeals = locationData.reduce((sum, item) => sum + item.count, 0);
  const topRegions = locationData.slice(0, 6);

  const getRegionColor = (count: number) => {
    const maxCount = Math.max(...locationData.map(d => d.count));
    const intensity = count / maxCount;
    
    if (intensity >= 0.8) return 'bg-blue-600 text-white';
    if (intensity >= 0.6) return 'bg-blue-500 text-white';
    if (intensity >= 0.4) return 'bg-blue-400 text-white';
    if (intensity >= 0.2) return 'bg-blue-300 text-blue-900';
    return 'bg-blue-100 text-blue-800';
  };

  const getRegionSize = (count: number) => {
    const maxCount = Math.max(...locationData.map(d => d.count));
    const ratio = count / maxCount;
    
    if (ratio >= 0.8) return 'text-xl font-bold';
    if (ratio >= 0.6) return 'text-lg font-semibold';
    if (ratio >= 0.4) return 'text-base font-medium';
    return 'text-sm';
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Deal Distribution by Location
        </CardTitle>
        <CardDescription>
          Geographic distribution across {locationData.length} locations • {totalDeals} total deals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {locationData.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No location data available</p>
            <p className="text-sm">Add location information to deals to see geographic distribution</p>
          </div>
        ) : (
          <>
            {/* Top Regions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRegions.map((location) => (
                <div
                  key={location.region}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    selectedRegion === location.region 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRegion(
                    selectedRegion === location.region ? null : location.region
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{location.region}</h3>
                    <Badge variant="secondary" className={getRegionColor(location.count)}>
                      {location.count} deals
                    </Badge>
                  </div>
                  
                  {location.regionInfo && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {location.regionInfo.abbr}
                    </p>
                  )}
                  
                  {location.cities.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {location.cities.length} cities: {location.cities.slice(0, 3).join(', ')}
                      {location.cities.length > 3 && ` +${location.cities.length - 3} more`}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      {Math.round((location.count / totalDeals) * 100)}% of total
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Region Details */}
            {selectedRegion && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-lg mb-3 text-blue-900">
                  {selectedRegion} - Deal Details
                </h4>
                {(() => {
                  const regionData = locationData.find(l => l.region === selectedRegion);
                  if (!regionData) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Total Deals:</span>
                          <p className="text-lg font-bold text-blue-900">{regionData.count}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Cities:</span>
                          <p className="text-lg font-bold text-blue-900">{regionData.cities.length}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Share:</span>
                          <p className="text-lg font-bold text-blue-900">
                            {Math.round((regionData.count / totalDeals) * 100)}%
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-blue-800 block mb-2">Recent Companies:</span>
                        <div className="flex flex-wrap gap-2">
                          {regionData.deals.slice(0, 6).map((deal) => (
                            <Badge key={deal.id} variant="outline" className="text-blue-700 border-blue-300">
                              {deal.company_name}
                            </Badge>
                          ))}
                          {regionData.deals.length > 6 && (
                            <Badge variant="outline" className="text-blue-700 border-blue-300">
                              +{regionData.deals.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* All Locations List */}
            {locationData.length > 6 && (
              <div>
                <h4 className="font-semibold mb-3">All Locations</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {locationData.map((location) => (
                    <div
                      key={location.region}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedRegion(
                        selectedRegion === location.region ? null : location.region
                      )}
                    >
                      <span className="truncate">{location.region}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {location.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{locationData.length}</p>
                  <p className="text-sm text-muted-foreground">Total Locations</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{totalDeals}</p>
                  <p className="text-sm text-muted-foreground">Total Deals</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {topRegions.length > 0 ? topRegions[0].count : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Largest Hub</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(totalDeals / locationData.length * 10) / 10}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg per Location</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
