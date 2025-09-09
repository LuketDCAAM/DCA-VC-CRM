
import React from 'react';
import { useDeals } from '@/hooks/useDeals';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { useAllCallNotes } from '@/hooks/useAllCallNotes';
import { useDealAnalytics } from '@/hooks/deals/useDealAnalytics';
import { useUserRoles } from '@/hooks/useUserRoles';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { TopActiveDealsCard } from '@/components/dashboard/TopActiveDealsCard';
import { RecentPortfolioCard } from '@/components/dashboard/RecentPortfolioCard';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';
import { RemindersWidget } from '@/components/reminders/RemindersWidget';
import { SectorChart } from '@/components/dashboard/charts/SectorChart';
import { MonthlyTrendChart } from '@/components/dashboard/charts/MonthlyTrendChart';
import { ValuationChart } from '@/components/dashboard/charts/ValuationChart';
import { RoundStageChart } from '@/components/dashboard/charts/RoundStageChart';
import { DealsLocationMap } from '@/components/dashboard/charts/DealsLocationMap';
import { ValuationRevenueMultipleChart } from '@/components/dashboard/charts/ValuationRevenueMultipleChart';

export default function Dashboard() {
  const { deals, loading: dealsLoading, dealStats } = useDeals();
  const { companies: portfolioCompanies, loading: portfolioLoading } = usePortfolioCompanies();
  const { callNotes, isLoading: callNotesLoading } = useAllCallNotes();
  const { isViewer } = useUserRoles();
  const analytics = useDealAnalytics(deals || [], callNotes || []);

  // Calculate total invested from portfolio companies
  const totalInvested = portfolioCompanies
    ?.reduce((total, company) => {
      const companyInvested = company.investments?.reduce((sum, inv) => sum + (inv.amount_invested || 0), 0) || 0;
      return total + companyInvested;
    }, 0) || 0;

  const isLoading = dealsLoading || portfolioLoading || callNotesLoading;

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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorChart data={analytics.sectorDistribution} />
        <RoundStageChart data={analytics.roundStageDistribution} />
      </div>

      {/* Detailed Analytics - Full Width */}
      <div className="grid grid-cols-1 gap-6">
        <ValuationChart data={analytics.valuationAnalysis} />
        <ValuationRevenueMultipleChart deals={deals || []} />
        <MonthlyTrendChart data={analytics.monthlyTrends} />
      </div>

      {/* Activity & Quick Actions - Hide Quick Actions for viewers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TopActiveDealsCard onViewDetails={() => {}} />
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
