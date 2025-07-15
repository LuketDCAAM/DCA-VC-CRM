
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Badge } from '@/components/ui/badge';
import { LocationData } from './LocationDataTypes';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface DealsMapProps {
  locationData: LocationData[];
}

export function DealsMap({ locationData }: DealsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Calculate dot sizes based on deal count
  const maxCount = Math.max(...locationData.map(l => l.count), 1);
  
  const getDotSize = (count: number) => {
    const minSize = 4;
    const maxSize = 12;
    return minSize + (count / maxCount) * (maxSize - minSize);
  };

  const getDotColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity >= 0.8) return '#1e40af'; // blue-800
    if (intensity >= 0.6) return '#3b82f6'; // blue-600
    if (intensity >= 0.4) return '#60a5fa'; // blue-400
    if (intensity >= 0.2) return '#93c5fd'; // blue-300
    return '#dbeafe'; // blue-100
  };

  return (
    <div className="w-full h-[300px] relative">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{
          scale: 600,
        }}
        width={600}
        height={300}
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#f3f4f6"
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#e5e7eb" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          
          {/* Render markers for each location */}
          {locationData
            .filter(location => location.regionInfo?.coords)
            .map((location) => {
              const [lat, lng] = location.regionInfo!.coords;
              const dotSize = getDotSize(location.count);
              return (
                <Marker
                  key={location.region}
                  coordinates={[lng, lat]}
                >
                  <g>
                    <circle
                      r={dotSize}
                      fill={getDotColor(location.count)}
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{
                        cursor: 'pointer',
                        opacity: selectedLocation === location.region ? 1 : 0.8,
                      }}
                      onClick={() => setSelectedLocation(
                        selectedLocation === location.region ? null : location.region
                      )}
                    />
                    {/* Deal count label */}
                    <text
                      textAnchor="middle"
                      y={1}
                      fontSize={dotSize > 8 ? "8" : "6"}
                      fill="#ffffff"
                      fontWeight="bold"
                      style={{
                        pointerEvents: 'none',
                        textShadow: '1px 1px 1px rgba(0,0,0,0.5)'
                      }}
                    >
                      {location.count}
                    </text>
                  </g>
                </Marker>
              );
            })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Deal Count</h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getDotColor(0.1) }}
            />
            <span className="text-xs">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getDotColor(0.5) }}
            />
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getDotColor(1) }}
            />
            <span className="text-xs">High</span>
          </div>
        </div>
      </div>

      {/* Selected location details */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
          {(() => {
            const location = locationData.find(l => l.region === selectedLocation);
            if (!location) return null;
            
            return (
              <div>
                <h4 className="font-semibold text-lg mb-2">{location.region}</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Total Deals: </span>
                    <Badge variant="secondary">{location.count}</Badge>
                  </div>
                  {location.cities.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Cities: </span>
                      <p className="text-xs text-muted-foreground">
                        {location.cities.slice(0, 3).join(', ')}
                        {location.cities.length > 3 && ` +${location.cities.length - 3} more`}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">Recent Companies: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {location.deals.slice(0, 3).map((deal) => (
                        <Badge key={deal.id} variant="outline" className="text-xs">
                          {deal.company_name}
                        </Badge>
                      ))}
                      {location.deals.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{location.deals.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
