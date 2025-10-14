
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { QuarterFilter } from './shared/QuarterFilter';
import { useQuarterFilter } from './shared/useQuarterFilter';
import { getChartColor, CHART_DIMENSIONS } from './shared/chartConfig';
import { Deal } from '@/types/deal';

interface SectorChartProps {
  data: Array<{ sector: string; count: number; percentage: number }>;
  deals: Deal[];
}

export function SectorChart({ data, deals }: SectorChartProps) {
  const { selectedQuarter, setSelectedQuarter, availableQuarters, filteredDeals: quarterFiltered } = useQuarterFilter(deals);
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(quarterFiltered);
  
  // Recalculate sector data based on filtered deals
  const sectorCounts = filteredDeals.reduce((acc, deal) => {
    const sector = deal.sector || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(sectorCounts).reduce((sum, count) => sum + count, 0);
  const calculatedData = Object.entries(sectorCounts)
    .map(([sector, count]) => ({
      sector,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  console.log('=== SECTOR CHART REBUILD ===');
  console.log('Show active only:', showActiveOnly);
  console.log('Filtered deals count:', filteredDeals.length);
  console.log('Calculated sector data:', calculatedData);

  const validData = calculatedData?.filter(item => 
    item && 
    typeof item.sector === 'string' && 
    item.sector.trim() !== '' &&
    typeof item.count === 'number' && 
    item.count > 0
  ) || [];

  console.log('Valid sector data count:', validData.length);

  const chartConfig = {
    count: {
      label: 'Deals',
    }
  };

  if (!validData.length) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Deal Distribution by Sector</CardTitle>
              <CardDescription>
                No sector data available
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <QuarterFilter
                selectedQuarter={selectedQuarter}
                onQuarterChange={setSelectedQuarter}
                availableQuarters={availableQuarters}
              />
              <PipelineToggle 
                showActiveOnly={showActiveOnly} 
                onToggle={setShowActiveOnly}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sector data available</p>
              <p className="text-sm">Add sector information to deals to see distribution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart with colors
  const chartData = validData.slice(0, 10).map((item, index) => ({
    ...item,
    fill: getChartColor(index, validData.length > 5)
  }));

  const totalDeals = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Deal Distribution by Sector</CardTitle>
            <CardDescription>
              {chartData.length} sectors • {totalDeals} total deals
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <QuarterFilter
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
              availableQuarters={availableQuarters}
            />
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent 
                    hideLabel
                    className="min-w-[140px]"
                    formatter={(value, name, props) => (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: props.payload.fill }}
                          />
                          <span className="font-medium">{props.payload.sector}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {value} deals ({props.payload.percentage}%)
                        </div>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => percentage >= 8 ? `${percentage}%` : ''}
                outerRadius={CHART_DIMENSIONS.pieOuterRadius}
                fill="#8884d8"
                dataKey="count"
                stroke="hsl(var(--background))"
                strokeWidth={CHART_DIMENSIONS.strokeWidth}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Legend */}
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {chartData.map((item, index) => (
              <div key={item.sector} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="truncate">{item.sector}</span>
                <span className="text-muted-foreground ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
