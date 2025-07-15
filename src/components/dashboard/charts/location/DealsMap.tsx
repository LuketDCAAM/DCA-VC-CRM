
import React, { useState, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { LocationData } from './LocationDataTypes';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface DealsMapProps {
  locationData: LocationData[];
}

export function DealsMap({ locationData }: DealsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  // Calculate dot sizes based on deal count - now with zoom scaling
  const maxCount = Math.max(...locationData.map(l => l.count), 1);
  
  const getDotSize = (count: number, zoom: number) => {
    const baseMinSize = 4;
    const baseMaxSize = 16;
    // Scale the base sizes by zoom level - make circles smaller as we zoom in
    const zoomFactor = Math.max(0.5, Math.min(2, 1 / Math.sqrt(zoom)));
    const minSize = baseMinSize * zoomFactor;
    const maxSize = baseMaxSize * zoomFactor;
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

  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  }, []);

  const handleZoomIn = () => {
    if (position.zoom < 4) {
      setPosition(prev => ({
        ...prev,
        zoom: prev.zoom * 1.5
      }));
    }
  };

  const handleZoomOut = () => {
    if (position.zoom > 1) {
      setPosition(prev => ({
        ...prev,
        zoom: prev.zoom / 1.5
      }));
    }
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
    setSelectedLocation(null);
  };

  // Sort locations by deal count (ascending) so larger bubbles are rendered last (on top)
  const sortedLocationData = [...locationData]
    .filter(location => location.regionInfo?.coords)
    .sort((a, b) => a.count - b.count);

  return (
    <div className="w-full h-[400px] relative bg-slate-50 rounded-lg overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          className="bg-white/90 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="bg-white/90 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#e2e8f0' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          
          {/* Deal location markers - sorted so larger bubbles render on top */}
          {sortedLocationData.map((location) => {
            const [lat, lng] = location.regionInfo!.coords;
            const dotSize = getDotSize(location.count, position.zoom);
            const isSelected = selectedLocation === location.region;
            
            return (
              <Marker key={location.region} coordinates={[lng, lat]}>
                <circle
                  r={dotSize}
                  fill={getDotColor(location.count)}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.9,
                    filter: isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                  }}
                  onClick={() => setSelectedLocation(
                    selectedLocation === location.region ? null : location.region
                  )}
                />
                {/* Deal count label for larger dots - adjust text size based on zoom */}
                {dotSize > 8 && (
                  <text
                    textAnchor="middle"
                    y={2}
                    fontSize={Math.max(8, 10 / Math.sqrt(position.zoom))}
                    fill="#ffffff"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {location.count}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

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
