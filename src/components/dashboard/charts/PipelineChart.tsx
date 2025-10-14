
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface PipelineChartProps {
  data: Array<{ stage: string; count: number; percentage: number }>;
  type?: 'pie' | 'bar';
}

const PIPELINE_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
  '#00ff00', '#ff00ff', '#00ffff', '#ff0000', '#0000ff'
];

export function PipelineChart({ data, type = 'pie' }: PipelineChartProps) {
  const chartConfig = data.reduce((config, item, index) => {
    config[item.stage] = {
      label: item.stage,
      color: PIPELINE_COLORS[index % PIPELINE_COLORS.length]
    };
    return config;
  }, {} as any);

  if (type === 'bar') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Distribution</CardTitle>
          <CardDescription>Deals across pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="stage" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Distribution</CardTitle>
        <CardDescription>Deal distribution across pipeline stages</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                outerRadius={90}
                dataKey="count"
                nameKey="stage"
                label={false}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PIPELINE_COLORS[index % PIPELINE_COLORS.length]} 
                  />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.stage}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.count} deals ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ChartLegend 
                content={<ChartLegendContent />}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
