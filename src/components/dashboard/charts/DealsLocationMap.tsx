
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MapPin } from 'lucide-react';
import { Deal } from '@/types/deal';
import { ACTIVE_PIPELINE_STAGES } from '@/hooks/deals/dealStagesConfig';
import { LocationCard } from './location/LocationCard';
import { LocationDetailsPanel } from './location/LocationDetailsPanel';
import { LocationSelector } from './location/LocationSelector';
import { LocationStats } from './location/LocationStats';
import { EmptyLocationState } from './location/EmptyLocationState';
import { useLocationData } from './location/useLocationData';

interface DealsLocationMapProps {
  deals: Deal[];
}

export function DealsLocationMap({ deals }: DealsLocationMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredDeals = useMemo(() => {
    if (!showActiveOnly) return deals;
    return deals.filter(deal => ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage as any));
  }, [deals, showActiveOnly]);

  const locationData = useLocationData(filteredDeals);
  const totalDeals = locationData.reduce((sum, item) => sum + item.count, 0);
  const topRegions = locationData.slice(0, 6);

  const handleLocationSelect = (locationRegion: string) => {
    setSelectedRegion(selectedRegion === locationRegion ? null : locationRegion);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Deal Distribution by Location
            </CardTitle>
            <CardDescription>
              Geographic distribution across {locationData.length} locations • {totalDeals} {showActiveOnly ? 'active' : 'total'} deals
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Total Deals</span>
            <Switch
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
            <span className="text-sm font-medium">Active Pipeline</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {locationData.length === 0 ? (
          <EmptyLocationState showActiveOnly={showActiveOnly} />
        ) : (
          <>
            {/* Top Regions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRegions.map((location) => (
                <LocationCard
                  key={location.region}
                  location={location}
                  totalDeals={totalDeals}
                  selectedRegion={selectedRegion}
                  onSelect={handleLocationSelect}
                />
              ))}
            </div>

            {/* Selected Region Details */}
            <LocationDetailsPanel
              selectedRegion={selectedRegion}
              locationData={locationData}
              totalDeals={totalDeals}
            />

            {/* All Locations Dropdown */}
            <LocationSelector
              locationData={locationData}
              onLocationSelect={handleLocationSelect}
            />

            {/* Summary Stats */}
            <LocationStats
              locationData={locationData}
              totalDeals={totalDeals}
              showActiveOnly={showActiveOnly}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
