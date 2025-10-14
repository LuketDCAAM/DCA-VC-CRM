import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Briefcase } from 'lucide-react';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { Deal } from '@/types/deal';

interface InvestmentVehicleChartProps {
  deals: Deal[];
}

const VEHICLE_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
];

export function InvestmentVehicleChart({ deals }: InvestmentVehicleChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);
  
  // Calculate investment vehicle distribution
  const vehicleCounts = filteredDeals.reduce((acc, deal) => {
    const vehicle = deal.investment_vehicle || 'Not Specified';
    acc[vehicle] = (acc[vehicle] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(vehicleCounts).reduce((sum, count) => sum + count, 0);
  const calculatedData = Object.entries(vehicleCounts)
    .map(([vehicle, count]) => ({
      vehicle,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const validData = calculatedData?.filter(item => 
    item && 
    typeof item.vehicle === 'string' && 
    item.vehicle.trim() !== '' &&
    typeof item.count === 'number' && 
    item.count > 0
  ) || [];

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
              <CardTitle>Investment Vehicle Distribution</CardTitle>
              <CardDescription>
                No investment vehicle data available
              </CardDescription>
            </div>
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No investment vehicle data available</p>
              <p className="text-sm">Add investment vehicle information to deals</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = validData.map((item, index) => ({
    ...item,
    fill: VEHICLE_COLORS[index % VEHICLE_COLORS.length]
  }));

  const totalDeals = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Investment Vehicle Distribution</CardTitle>
            <CardDescription>
              {chartData.length} vehicle{chartData.length !== 1 ? 's' : ''} • {totalDeals} total deals
            </CardDescription>
          </div>
          <PipelineToggle 
            showActiveOnly={showActiveOnly} 
            onToggle={setShowActiveOnly}
          />
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
                          <span className="font-medium">{props.payload.vehicle}</span>
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
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
                  if (percentage < 8) return null;
                  
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      fill="white" 
                      textAnchor={x > cx ? 'start' : 'end'} 
                      dominantBaseline="central"
                      fontSize="12"
                      fontWeight="500"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      {`${percentage}%`}
                    </text>
                  );
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                stroke="#ffffff"
                strokeWidth={2}
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
            {chartData.map((item) => (
              <div key={item.vehicle} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="truncate">{item.vehicle}</span>
                <span className="text-muted-foreground ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
