
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { LocationData } from './LocationDataTypes';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json";

interface DealsMapProps {
  locationData: LocationData[];
}

export function DealsMap({ locationData }: DealsMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  // Calculate dot sizes based on deal count
  const maxCount = Math.max(...locationData.map(l => l.count), 1);
  
  const getDotSize = (count: number) => {
    const minSize = 2;
    const maxSize = 6;
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 8));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 1));
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([0, 0]);
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  };

  return (
    <div className="w-full h-[400px] relative overflow-hidden bg-slate-50 rounded-lg">
      {/* Zoom Controls */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm"
          onClick={handleReset}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{
          scale: 120,
        }}
        width={800}
        height={400}
        className="w-full h-full"
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
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
                  fill="#f8fafc"
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#f1f5f9" },
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
                      strokeWidth={1}
                      style={{
                        cursor: 'pointer',
                        opacity: selectedLocation === location.region ? 1 : 0.8,
                      }}
                      onClick={() => setSelectedLocation(
                        selectedLocation === location.region ? null : location.region
                      )}
                    />
                    {/* Deal count label - only show for larger dots and higher zoom */}
                    {dotSize > 4 && zoom > 2 && (
                      <text
                        textAnchor="middle"
                        y={1}
                        fontSize={Math.min(4, zoom)}
                        fill="#ffffff"
                        fontWeight="bold"
                        style={{
                          pointerEvents: 'none',
                          textShadow: '1px 1px 1px rgba(0,0,0,0.5)'
                        }}
                      >
                        {location.count}
                      </text>
                    )}
                  </g>
                </Marker>
              );
            })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
        <h4 className="font-semibold text-xs mb-1">Deal Count</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getDotColor(0.1) }}
            />
            <span className="text-xs">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getDotColor(0.5) }}
            />
            <span className="text-xs">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getDotColor(1) }}
            />
            <span className="text-xs">High</span>
          </div>
        </div>
      </div>

      {/* Selected location details */}
      {selectedLocation && (
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          {(() => {
            const location = locationData.find(l => l.region === selectedLocation);
            if (!location) return null;
            
            return (
              <div>
                <h4 className="font-semibold text-sm mb-2">{location.region}</h4>
                <div className="space-y-1">
                  <div>
                    <span className="text-xs font-medium">Total Deals: </span>
                    <Badge variant="secondary" className="text-xs">{location.count}</Badge>
                  </div>
                  {location.cities.length > 0 && (
                    <div>
                      <span className="text-xs font-medium">Cities: </span>
                      <p className="text-xs text-muted-foreground">
                        {location.cities.slice(0, 2).join(', ')}
                        {location.cities.length > 2 && ` +${location.cities.length - 2} more`}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium">Recent Companies: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {location.deals.slice(0, 2).map((deal) => (
                        <Badge key={deal.id} variant="outline" className="text-xs">
                          {deal.company_name}
                        </Badge>
                      ))}
                      {location.deals.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{location.deals.length - 2}
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

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
        <span className="text-xs font-medium">Zoom: {zoom.toFixed(1)}x</span>
      </div>
    </div>
  );
}
