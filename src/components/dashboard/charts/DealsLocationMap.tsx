
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, CalendarIcon, X } from 'lucide-react';
import { Deal } from '@/types/deal';
import { ACTIVE_PIPELINE_STAGES } from '@/hooks/deals/dealStagesConfig';
import { DealsMap } from './location/DealsMap';
import { useLocationData } from './location/useLocationData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DealsLocationMapProps {
  deals: Deal[];
}

export function DealsLocationMap({ deals }: DealsLocationMapProps) {
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const filteredDeals = useMemo(() => {
    let result = deals;
    if (showActiveOnly) {
      result = result.filter(deal => ACTIVE_PIPELINE_STAGES.includes(deal.pipeline_stage as any));
    }
    if (dateFrom) {
      const fromStr = format(dateFrom, 'yyyy-MM-dd');
      result = result.filter(deal => deal.created_at && deal.created_at.slice(0, 10) >= fromStr);
    }
    if (dateTo) {
      const toStr = format(dateTo, 'yyyy-MM-dd');
      result = result.filter(deal => deal.created_at && deal.created_at.slice(0, 10) <= toStr);
    }
    return result;
  }, [deals, showActiveOnly, dateFrom, dateTo]);

  const locationData = useLocationData(filteredDeals);
  const totalDeals = locationData.reduce((sum, item) => sum + item.count, 0);
  const hasDateFilter = dateFrom || dateTo;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Deal Distribution by Location
            </CardTitle>
            <CardDescription>
              Geographic distribution across {locationData.length} locations • {totalDeals} {showActiveOnly ? 'active' : 'total'} deals
              {hasDateFilter && ' (filtered)'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs w-[120px] justify-start", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateFrom ? format(dateFrom, 'MM/dd/yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">To</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs w-[120px] justify-start", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateTo ? format(dateTo, 'MM/dd/yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {hasDateFilter && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Deals</span>
              <Switch checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
              <span className="text-sm font-medium">Active Pipeline</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DealsMap locationData={locationData} />
      </CardContent>
    </Card>
  );
}