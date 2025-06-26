
import React from 'react';
import { LocationData } from './LocationDataTypes';

interface LocationStatsProps {
  locationData: LocationData[];
  totalDeals: number;
  showActiveOnly: boolean;
}

export function LocationStats({ locationData, totalDeals, showActiveOnly }: LocationStatsProps) {
  const topRegions = locationData.slice(0, 6);

  return (
    <div className="border-t pt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">{locationData.length}</p>
          <p className="text-sm text-muted-foreground">Total Locations</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{totalDeals}</p>
          <p className="text-sm text-muted-foreground">{showActiveOnly ? 'Active' : 'Total'} Deals</p>
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
  );
}
