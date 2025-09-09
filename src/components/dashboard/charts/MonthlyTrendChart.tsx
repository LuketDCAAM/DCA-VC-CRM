import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { PipelineToggle } from './shared/PipelineToggle';
import { usePipelineFilter } from './shared/usePipelineFilter';
import { Deal } from '@/types/deal';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; deals: number; invested: number; firstCalls: number }>;
  deals: Deal[];
}

export function MonthlyTrendChart({ data, deals }: MonthlyTrendChartProps) {
  const { showActiveOnly, setShowActiveOnly, filteredDeals } = usePipelineFilter(deals);
  
  // For simplicity, using original data (would recalculate in real implementation)
  const chartData = data;
  
  const chartConfig = {
    deals: {
      label: 'New Deals',
      color: '#8884d8'
    },
    invested: {
      label: 'Invested',
      color: '#82ca9d'
    },
    firstCalls: {
      label: 'First Calls',
      color: '#ff7300'
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
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar 
                dataKey="deals" 
                fill="#8884d8" 
                name="Deals Sourced" 
                yAxisId="left" 
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="invested" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Invested"
                yAxisId="right"
              />
              <Line 
                type="monotone" 
                dataKey="firstCalls" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={{ r: 4 }}
                name="First Calls"
                yAxisId="right"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}