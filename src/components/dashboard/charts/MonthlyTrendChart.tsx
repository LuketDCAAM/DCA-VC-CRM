import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { getChartColor } from './shared/chartConfig';
import { Deal } from '@/types/deal';
import { useUserRoles } from '@/hooks/useUserRoles';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; deals: number; invested: number; firstCalls: number }>;
  deals: Deal[];
}

export function MonthlyTrendChart({ data, deals }: MonthlyTrendChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);
  const { isViewer } = useUserRoles();
  
  // For simplicity, using original data (would recalculate in real implementation)
  const chartData = data;
  
  const chartConfig = {
    deals: {
      label: 'New Deals',
      color: getChartColor(0)
    },
    invested: {
      label: 'Invested',
      color: getChartColor(1)
    },
    firstCalls: {
      label: 'First Calls',
      color: getChartColor(2)
    }
  };

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>New deals, investments, and activity trends</CardDescription>
            </div>
            <PipelineToggle 
              showActiveOnly={showActiveOnly} 
              onToggle={setShowActiveOnly}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No trend data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>New deals, investments, and activity trends over time</CardDescription>
          </div>
          <PipelineToggle 
            showActiveOnly={showActiveOnly} 
            onToggle={setShowActiveOnly}
          />
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ChartContainer config={chartConfig} className="h-[400px] w-full max-w-4xl">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar 
                dataKey="deals" 
                fill={getChartColor(0)}
                name="Deals Sourced" 
                yAxisId="left" 
                radius={[4, 4, 0, 0]}
              />
              {!isViewer && (
                <Line 
                  type="monotone" 
                  dataKey="invested" 
                  stroke={getChartColor(1)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Invested"
                  yAxisId="right"
                />
              )}
              {!isViewer && (
                <Line 
                  type="monotone" 
                  dataKey="firstCalls" 
                  stroke={getChartColor(2)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="First Calls"
                  yAxisId="right"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}