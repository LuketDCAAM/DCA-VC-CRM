import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Deal } from '@/types/deal';
import { format, startOfQuarter, parseISO, subYears } from 'date-fns';

interface ValuationRevenueMultipleChartProps {
  deals: Deal[];
}

interface QuarterlyMultiple {
  quarter: string;
  averageMultiple: number;
  medianMultiple: number;
  dealsCount: number;
}

function calculateValuationRevenueMultiples(deals: Deal[]): QuarterlyMultiple[] {
  // Filter deals that have both valuation and revenue data
  const dealsWithData = deals.filter(deal => 
    deal.post_money_valuation && 
    deal.revenue && 
    deal.post_money_valuation > 0 && 
    deal.revenue > 0 &&
    deal.created_at
  );

  console.log('Total deals with valuation/revenue data:', dealsWithData.length);
  console.log('Sample deals with data:', dealsWithData.slice(0, 5).map(d => ({
    name: d.company_name,
    valuation: d.post_money_valuation,
    revenue: d.revenue,
    date: d.created_at
  })));

  // Show all available data instead of filtering by 2 years
  // This will help us see what quarters actually have data
  const allDeals = dealsWithData;

  // Group by quarter
  const quarterlyData = allDeals.reduce((acc, deal) => {
    const dealDate = parseISO(deal.created_at);
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
  const data = calculateValuationRevenueMultiples(deals);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Multiple Trends (All Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p>No deals with both valuation and revenue data</p>
              <p className="text-sm mt-1">Add deals with valuation and revenue to see multiples</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Multiple Trends (All Data)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Average and median valuation/revenue multiples by quarter (capped at 100x)
        </p>
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
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Average Multiple"
              />
              <Line 
                type="monotone" 
                dataKey="medianMultiple" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                name="Median Multiple"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary"></div>
            <span className="text-muted-foreground">Average Multiple</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-chart-2 border-dashed border-t-2"></div>
            <span className="text-muted-foreground">Median Multiple</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}