
import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Deal } from '@/types/deal';
import { MapPin } from 'lucide-react';

interface DealsLocationMapProps {
  deals: Deal[];
}

// Common US city coordinates for mapping
const CITY_COORDINATES: Record<string, [number, number]> = {
  'San Francisco': [-122.4194, 37.7749],
  'New York': [-74.0060, 40.7128],
  'Los Angeles': [-118.2437, 34.0522],
  'Austin': [-97.7431, 30.2672],
  'Seattle': [-122.3321, 47.6062],
  'Boston': [-71.0589, 42.3601],
  'Chicago': [-87.6298, 41.8781],
  'Denver': [-104.9903, 39.7392],
  'Miami': [-80.1918, 25.7617],
  'Atlanta': [-84.3880, 33.7490],
  'Portland': [-122.6765, 45.5152],
  'Dallas': [-96.7970, 32.7767],
  'Houston': [-95.3698, 29.7604],
  'Phoenix': [-112.0740, 33.4484],
  'San Diego': [-117.1611, 32.7157],
  'Las Vegas': [-115.1398, 36.1699],
  'Nashville': [-86.7816, 36.1627],
  'Raleigh': [-78.6382, 35.7796],
  'Washington DC': [-77.0369, 38.9072],
  'Philadelphia': [-75.1652, 39.9526],
};

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export function DealsLocationMap({ deals }: DealsLocationMapProps) {
  const locationData = useMemo(() => {
    const locationCounts: Record<string, { count: number; deals: Deal[] }> = {};
    
    deals.forEach(deal => {
      if (deal.location && deal.location.trim() !== '') {
        const location = deal.location.trim();
        if (!locationCounts[location]) {
          locationCounts[location] = { count: 0, deals: [] };
        }
        locationCounts[location].count++;
        locationCounts[location].deals.push(deal);
      }
    });

    return Object.entries(locationCounts)
      .map(([location, data]) => {
        const coordinates = CITY_COORDINATES[location];
        if (coordinates) {
          return {
            location,
            count: data.count,
            deals: data.deals,
            coordinates
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [deals]);

  const getMarkerSize = (count: number) => {
    if (count <= 1) return 8;
    if (count <= 3) return 12;
    if (count <= 5) return 16;
    return 20;
  };

  const getMarkerColor = (count: number) => {
    if (count <= 1) return '#93c5fd'; // blue-300
    if (count <= 3) return '#3b82f6'; // blue-500
    if (count <= 5) return '#1d4ed8'; // blue-700
    return '#1e40af'; // blue-800
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Deals by Location
        </CardTitle>
        <CardDescription>
          Geographic distribution of deals across different cities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{
              scale: 1000,
            }}
            width={800}
            height={400}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#f3f4f6"
                    stroke="#e5e7eb"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Geographies>
            {locationData.map((location, index) => (
              <Marker key={index} coordinates={location.coordinates}>
                <g>
                  <circle
                    r={getMarkerSize(location.count)}
                    fill={getMarkerColor(location.count)}
                    fillOpacity={0.8}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <text
                    textAnchor="middle"
                    y={getMarkerSize(location.count) + 15}
                    style={{
                      fontFamily: 'system-ui',
                      fontSize: '12px',
                      fill: '#374151',
                      fontWeight: '500'
                    }}
                  >
                    {location.location}
                  </text>
                  <text
                    textAnchor="middle"
                    y={getMarkerSize(location.count) + 28}
                    style={{
                      fontFamily: 'system-ui',
                      fontSize: '10px',
                      fill: '#6b7280'
                    }}
                  >
                    ({location.count} deals)
                  </text>
                </g>
              </Marker>
            ))}
          </ComposableMap>
        </div>
        
        {locationData.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                <span>1 deal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>2-3 deals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-700"></div>
                <span>4-5 deals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-800"></div>
                <span>6+ deals</span>
              </div>
            </div>
          </div>
        )}

        {locationData.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No location data available for deals</p>
            <p className="text-sm">Add location information to deals to see them on the map</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
