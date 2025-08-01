
import React from 'react';
import { useDeals } from '@/hooks/useDeals';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { useDealAnalytics } from '@/hooks/deals/useDealAnalytics';
import { useUserRoles } from '@/hooks/useUserRoles';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RecentDealsCard } from '@/components/dashboard/RecentDealsCard';
import { RecentPortfolioCard } from '@/components/dashboard/RecentPortfolioCard';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';
import { RemindersWidget } from '@/components/reminders/RemindersWidget';
import { PipelineChart } from '@/components/dashboard/charts/PipelineChart';
import { SectorChart } from '@/components/dashboard/charts/SectorChart';
import { MonthlyTrendChart } from '@/components/dashboard/charts/MonthlyTrendChart';
import { ValuationChart } from '@/components/dashboard/charts/ValuationChart';
import { RoundStageChart } from '@/components/dashboard/charts/RoundStageChart';
import { PortfolioPerformanceChart } from '@/components/dashboard/charts/PortfolioPerformanceChart';
import { DealsLocationMap } from '@/components/dashboard/charts/DealsLocationMap';

export default function Dashboard() {
  const { deals, loading: dealsLoading, dealStats } = useDeals();
  const { companies: portfolioCompanies, loading: portfolioLoading } = usePortfolioCompanies();
  const { isViewer } = useUserRoles();
  const analytics = useDealAnalytics(deals || []);

  // Calculate total invested from portfolio companies
  const totalInvested = portfolioCompanies
    ?.reduce((total, company) => {
      const companyInvested = company.investments?.reduce((sum, inv) => sum + (inv.amount_invested || 0), 0) || 0;
      return total + companyInvested;
    }, 0) || 0;

  const isLoading = dealsLoading || portfolioLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <DashboardMetrics
        activeDeals={dealStats.activeDeals}
        portfolioCount={portfolioCompanies?.length || 0}
        totalDeals={dealStats.totalDeals}
        totalInvested={totalInvested}
      />

      {/* Geographic Distribution */}
      <DealsLocationMap deals={deals || []} />

      {/* Primary Analytics - Deal Flow & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineChart data={analytics.pipelineDistribution} />
        <SectorChart data={analytics.sectorDistribution} />
      </div>

      {/* Secondary Analytics - Round Stage & Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoundStageChart data={analytics.roundStageDistribution} />
        <PortfolioPerformanceChart 
          portfolioCount={portfolioCompanies?.length || 0}
          totalInvested={totalInvested}
        />
      </div>

      {/* Detailed Analytics - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <ValuationChart data={analytics.valuationAnalysis} />
        <MonthlyTrendChart data={analytics.monthlyTrends} />
      </div>

      {/* Activity & Quick Actions - Hide Quick Actions for viewers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RecentDealsCard deals={deals?.slice(0, 5) || []} />
          {!isViewer && <RemindersWidget />}
        </div>
        <div className="space-y-6">
          <RecentPortfolioCard 
            companies={portfolioCompanies?.slice(0, 5) || []} 
            onViewDetails={() => {}} 
          />
          {!isViewer && <DashboardQuickActions />}
        </div>
      </div>
    </div>
  );
}
