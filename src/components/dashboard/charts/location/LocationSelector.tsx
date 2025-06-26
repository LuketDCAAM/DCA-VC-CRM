
import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationData } from './LocationDataTypes';

interface LocationSelectorProps {
  locationData: LocationData[];
  onLocationSelect: (location: string) => void;
}

export function LocationSelector({ locationData, onLocationSelect }: LocationSelectorProps) {
  if (locationData.length <= 6) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">All Locations</h4>
      <Select onValueChange={onLocationSelect}>
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder={`Browse all ${locationData.length} locations...`} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {locationData.map((location) => (
            <SelectItem key={location.region} value={location.region}>
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{location.region}</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {location.count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
