
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MapPin } from 'lucide-react';
import { Deal } from '@/types/deal';
import { ACTIVE_PIPELINE_STAGES } from '@/hooks/deals/dealStagesConfig';
import { DealsMap } from './location/DealsMap';
import { useLocationData } from './location/useLocationData';

interface DealsLocationMapProps {
  deals: Deal[];
}

export function DealsLocationMap({ deals }: DealsLocationMapProps) {
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredDeals = useMemo(() => {
    if (!showActiveOnly) return deals;
    return deals.filter(deal => ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage as any));
  }, [deals, showActiveOnly]);

  const locationData = useLocationData(filteredDeals);
  const totalDeals = locationData.reduce((sum, item) => sum + item.count, 0);

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
      <CardContent>
        <DealsMap locationData={locationData} />
      </CardContent>
    </Card>
  );
}
