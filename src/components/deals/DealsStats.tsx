
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DealsStatsProps {
  totalDeals: number;
  activeDeals: number;
  investedDeals: number;
  passedDeals: number;
  screeningDeals: number;
}

export function DealsStats({
  totalDeals,
  activeDeals,
  investedDeals,
  passedDeals,
  screeningDeals,
}: DealsStatsProps) {
  const stats = [
    { label: 'Total Deals', value: totalDeals, color: 'text-blue-600' },
    { label: 'Active', value: activeDeals, color: 'text-green-600' },
    { label: 'Invested', value: investedDeals, color: 'text-purple-600' },
    { label: 'Passed', value: passedDeals, color: 'text-red-600' },
    { label: 'Screening', value: screeningDeals, color: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 mb-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border border-border">
          <CardContent className="p-2 text-center">
            <div className={`text-lg font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
