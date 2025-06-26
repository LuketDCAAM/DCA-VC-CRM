
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LocationData } from './LocationDataTypes';

interface LocationDetailsPanelProps {
  selectedRegion: string | null;
  locationData: LocationData[];
  totalDeals: number;
}

export function LocationDetailsPanel({ selectedRegion, locationData, totalDeals }: LocationDetailsPanelProps) {
  if (!selectedRegion) return null;

  const regionData = locationData.find(l => l.region === selectedRegion);
  if (!regionData) return null;

  return (
    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
      <h4 className="font-semibold text-lg mb-3 text-blue-900">
        {selectedRegion} - Deal Details
      </h4>
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
    </div>
  );
}
