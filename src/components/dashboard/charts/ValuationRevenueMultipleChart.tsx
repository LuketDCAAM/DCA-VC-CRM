import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { Deal } from '@/types/deal';
import { format, startOfQuarter, parseISO, subYears } from 'date-fns';
import { normalizeLocationToFilterKey } from '@/utils/locationUtils';

interface ValuationRevenueMultipleChartProps {
  deals: Deal[];
}

interface QuarterlyMultiple {
  quarter: string;
  averageMultiple: number;
  medianMultiple: number;
  dealsCount: number;
}

function calculateValuationRevenueMultiples(deals: Deal[], selectedRounds: string[], selectedLocations: string[]): QuarterlyMultiple[] {
  // Filter deals that have both valuation and revenue data
  let dealsWithData = deals.filter(deal => 
    deal.post_money_valuation && 
    deal.revenue && 
    deal.post_money_valuation > 0 && 
    deal.revenue > 0 &&
    (deal.source_date || deal.created_at)
  );

  // Apply filters
  if (selectedRounds.length > 0) {
    dealsWithData = dealsWithData.filter(deal => 
      deal.round_stage && selectedRounds.includes(deal.round_stage)
    );
  }

  if (selectedLocations.length > 0) {
    dealsWithData = dealsWithData.filter(deal => {
      if (!deal.location) return false;
      const normalizedLocation = normalizeLocationToFilterKey(deal.location);
      return selectedLocations.includes(normalizedLocation);
    });
  }

  console.log('Total deals with valuation/revenue data:', dealsWithData.length);
  console.log('Sample deals with data:', dealsWithData.slice(0, 5).map(d => ({
    name: d.company_name,
    valuation: d.post_money_valuation,
    revenue: d.revenue,
    sourceDate: d.source_date,
    createdAt: d.created_at,
    usedDate: d.source_date || d.created_at
  })));

  // Show all available data instead of filtering by 2 years
  // This will help us see what quarters actually have data
  const allDeals = dealsWithData;

  // Group by quarter using source_date or created_at as fallback
  const quarterlyData = allDeals.reduce((acc, deal) => {
    const dealDate = parseISO(deal.source_date || deal.created_at);
    const quarterStart = startOfQuarter(dealDate);
    const quarterKey = format(quarterStart, 'yyyy-QQQ');
    
    const multiple = Number(deal.post_money_valuation) / Number(deal.revenue);
    
    if (!acc[quarterKey]) {
      acc[quarterKey] = {
        quarter: quarterKey,
        multiples: [],
        dealsCount: 0
      };
    }
    
    // Cap extreme multiples at 100x to avoid chart distortion
    const cappedMultiple = Math.min(multiple, 100);
    acc[quarterKey].multiples.push(cappedMultiple);
    acc[quarterKey].dealsCount++;
    
    return acc;
  }, {} as Record<string, { quarter: string; multiples: number[]; dealsCount: number }>);

  // Calculate average and median for each quarter
  const result = Object.values(quarterlyData)
    .map(data => {
      const sortedMultiples = data.multiples.sort((a, b) => a - b);
      const average = data.multiples.reduce((sum, val) => sum + val, 0) / data.multiples.length;
      const median = sortedMultiples.length % 2 === 0
        ? (sortedMultiples[sortedMultiples.length / 2 - 1] + sortedMultiples[sortedMultiples.length / 2]) / 2
        : sortedMultiples[Math.floor(sortedMultiples.length / 2)];

      return {
        quarter: data.quarter,
        averageMultiple: Math.round(average * 10) / 10,
        medianMultiple: Math.round(median * 10) / 10,
        dealsCount: data.dealsCount
      };
    })
    .sort((a, b) => a.quarter.localeCompare(b.quarter));

  return result;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-blue-600">
          Average Multiple: {data.averageMultiple}x
        </p>
        <p className="text-sm text-green-600">
          Median Multiple: {data.medianMultiple}x
        </p>
        <p className="text-sm text-muted-foreground">
          Deals: {data.dealsCount}
        </p>
      </div>
    );
  }
  return null;
};

export function ValuationRevenueMultipleChart({ deals }: ValuationRevenueMultipleChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);
  const [selectedRounds, setSelectedRounds] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Get unique rounds and locations from filtered deals with valuation/revenue data
  const availableRounds = useMemo(() => {
    const rounds = filteredDeals
      .filter(deal => deal.post_money_valuation && deal.revenue && deal.round_stage)
      .map(deal => deal.round_stage!)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return rounds;
  }, [filteredDeals]);

  const availableLocations = useMemo(() => {
    const locations = filteredDeals
      .filter(deal => deal.post_money_valuation && deal.revenue && deal.location)
      .map(deal => normalizeLocationToFilterKey(deal.location!))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return locations;
  }, [filteredDeals]);

  const data = calculateValuationRevenueMultiples(filteredDeals, selectedRounds, selectedLocations);

  const toggleRound = (round: string) => {
    setSelectedRounds(prev => 
      prev.includes(round) 
        ? prev.filter(r => r !== round)
        : [...prev, round]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const removeLocation = (location: string) => {
    setSelectedLocations(prev => prev.filter(l => l !== location));
  };

  const clearAllFilters = () => {
    setSelectedRounds([]);
    setSelectedLocations([]);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Revenue Multiple Trends (All Data)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Average and median valuation/revenue multiples by quarter (capped at 100x)
              </p>
            </div>
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
          
          {/* Filter Controls */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Round Stage</h4>
                {(selectedRounds.length > 0 || selectedLocations.length > 0) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableRounds.map(round => (
                  <Badge
                    key={round}
                    variant={selectedRounds.includes(round) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => toggleRound(round)}
                  >
                    {round}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium">Geography</h4>
                <Select onValueChange={toggleLocation}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Select locations..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {availableLocations.map(location => (
                      <SelectItem 
                        key={location} 
                        value={location}
                        className="hover:bg-muted cursor-pointer"
                      >
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedLocations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedLocations.map(location => (
                    <Badge
                      key={location}
                      variant="default"
                      className="text-xs flex items-center gap-1"
                    >
                      {location}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeLocation(location)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p>No deals with both valuation and revenue data match your filters</p>
              <p className="text-sm mt-1">Try adjusting your filters or add more deals with valuation and revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Revenue Multiple Trends (All Data)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Average and median valuation/revenue multiples by quarter (capped at 100x)
            </p>
          </div>
          <PipelineToggle 
            showActiveOnly={showActiveOnly} 
            onToggle={setShowActiveOnly}
          />
        </div>
        
        {/* Filter Controls */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Round Stage</h4>
              {(selectedRounds.length > 0 || selectedLocations.length > 0) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableRounds.map(round => (
                <Badge
                  key={round}
                  variant={selectedRounds.includes(round) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => toggleRound(round)}
                >
                  {round}
                </Badge>
              ))}
            </div>
          </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium">Geography</h4>
                <Select onValueChange={toggleLocation}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Select locations..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {availableLocations.map(location => (
                      <SelectItem 
                        key={location} 
                        value={location}
                        className="hover:bg-muted cursor-pointer"
                      >
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedLocations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedLocations.map(location => (
                    <Badge
                      key={location}
                      variant="default"
                      className="text-xs flex items-center gap-1"
                    >
                      {location}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeLocation(location)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="quarter" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Multiple (x)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="averageMultiple" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                name="Average Multiple"
              />
              <Line 
                type="monotone" 
                dataKey="medianMultiple" 
                stroke="#a855f7" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                name="Median Multiple"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-500"></div>
            <span className="text-muted-foreground">Average Multiple</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500 border-dashed border-t-2"></div>
            <span className="text-muted-foreground">Median Multiple</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}