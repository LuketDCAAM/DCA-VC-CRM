
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { LocationData } from './LocationDataTypes';

interface LocationCardProps {
  location: LocationData;
  totalDeals: number;
  selectedRegion: string | null;
  onSelect: (region: string) => void;
}

export function LocationCard({ location, totalDeals, selectedRegion, onSelect }: LocationCardProps) {
  const getRegionColor = (count: number) => {
    const maxCount = Math.max(count, 1);
    const intensity = count / maxCount;
    
    if (intensity >= 0.8) return 'bg-blue-600 text-white';
    if (intensity >= 0.6) return 'bg-blue-500 text-white';
    if (intensity >= 0.4) return 'bg-blue-400 text-white';
    if (intensity >= 0.2) return 'bg-blue-300 text-blue-900';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
        selectedRegion === location.region 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelect(location.region)}
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
  );
}
