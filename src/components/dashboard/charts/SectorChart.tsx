
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SectorChartProps {
  data: Array<{ sector: string; count: number; percentage: number }>;
}

// Modern color palette for sectors
const SECTOR_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

export function SectorChart({ data }: SectorChartProps) {
  console.log('=== SECTOR CHART REBUILD ===');
  console.log('Received sector data:', data);

  const validData = data?.filter(item => 
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
          <CardTitle>Deal Distribution by Sector</CardTitle>
          <CardDescription>
            No sector data available
          </CardDescription>
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
    fill: SECTOR_COLORS[index % SECTOR_COLORS.length]
  }));

  const totalDeals = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Deal Distribution by Sector</CardTitle>
        <CardDescription>
          {chartData.length} sectors • {totalDeals} total deals
        </CardDescription>
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
                label={({ sector, percentage }) => 
                  percentage > 5 ? `${sector} (${percentage}%)` : ''
                }
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
