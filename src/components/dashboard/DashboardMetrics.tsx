
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardMetricsProps {
  activeDeals: number;
  portfolioCount: number;
  totalDeals: number;
  totalInvested: number;
}

export function DashboardMetrics({ 
  activeDeals, 
  portfolioCount, 
  totalDeals, 
  totalInvested 
}: DashboardMetricsProps) {
  console.log('=== DASHBOARD METRICS RENDER ===');
  console.log('DashboardMetrics received props:', {
    activeDeals,
    portfolioCount,
    totalDeals,
    totalInvested
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const metrics = [
    {
      title: "Active Pipeline",
      value: activeDeals,
      description: "deals in active stages",
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "Portfolio Companies",
      value: portfolioCount,
      description: "active investments",
      icon: Building2,
      color: "text-green-600",
    },
    {
      title: "Total Deals",
      value: totalDeals,
      description: "all time",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Total Invested",
      value: totalInvested > 0 ? formatCurrency(totalInvested) : '$0',
      description: "across portfolio",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
