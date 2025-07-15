
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { LocationData } from './LocationDataTypes';

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

  // Simplified coordinate mapping for US states/regions
  const getCoordinates = (regionInfo: any) => {
    if (!regionInfo?.coords) return null;
    const [lat, lng] = regionInfo.coords;
    
    // Convert lat/lng to SVG coordinates (simplified US map)
    // US bounds: roughly lat 24-49, lng -125 to -66
    const mapWidth = 800;
    const mapHeight = 400;
    
    const x = ((lng + 125) / 59) * mapWidth;
    const y = ((49 - lat) / 25) * mapHeight;
    
    return { x, y };
  };

  return (
    <div className="w-full h-[400px] relative bg-slate-50 rounded-lg overflow-hidden">
      {/* Simple SVG Map */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        className="w-full h-full"
      >
        {/* US map outline (simplified) */}
        <path
          d="M 50 300 L 50 100 L 200 50 L 400 80 L 600 90 L 750 120 L 750 300 L 600 350 L 400 340 L 200 320 Z"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          opacity="0.3"
        />
        
        {/* State boundaries (simplified grid) */}
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={100 + i * 120}
            y1={50}
            x2={100 + i * 120}
            y2={350}
            stroke="#cbd5e1"
            strokeWidth="1"
            opacity="0.2"
          />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={50}
            y1={100 + i * 80}
            x2={750}
            y2={100 + i * 80}
            stroke="#cbd5e1"
            strokeWidth="1"
            opacity="0.2"
          />
        ))}
        
        {/* Deal location dots */}
        {locationData
          .filter(location => location.regionInfo?.coords)
          .map((location) => {
            const coords = getCoordinates(location.regionInfo);
            if (!coords) return null;
            
            const dotSize = getDotSize(location.count);
            const isSelected = selectedLocation === location.region;
            
            return (
              <g key={location.region}>
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={dotSize}
                  fill={getDotColor(location.count)}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.9,
                    filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                  }}
                  onClick={() => setSelectedLocation(
                    selectedLocation === location.region ? null : location.region
                  )}
                />
                {/* Deal count label */}
                {dotSize > 8 && (
                  <text
                    x={coords.x}
                    y={coords.y + 2}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#ffffff"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {location.count}
                  </text>
                )}
              </g>
            );
          })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-sm">
        <h4 className="font-semibold text-xs mb-2">Deal Count</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getDotColor(0.1) }}
            />
            <span className="text-xs">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getDotColor(0.5) }}
            />
            <span className="text-xs">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-5 h-5 rounded-full"
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
                <h4 className="font-semibold text-sm mb-2">{location.region}</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium">Total Deals: </span>
                    <Badge variant="secondary" className="text-xs">{location.count}</Badge>
                  </div>
                  {location.cities.length > 0 && (
                    <div>
                      <span className="text-xs font-medium">Cities: </span>
                      <p className="text-xs text-muted-foreground">
                        {location.cities.slice(0, 3).join(', ')}
                        {location.cities.length > 3 && ` +${location.cities.length - 3} more`}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium">Recent Companies: </span>
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

      {/* Total locations indicator */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded px-3 py-2">
        <span className="text-xs font-medium">
          {locationData.length} {locationData.length === 1 ? 'Location' : 'Locations'}
        </span>
      </div>
    </div>
  );
}
