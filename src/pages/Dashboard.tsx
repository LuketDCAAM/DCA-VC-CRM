
import React from 'react';
import { useDeals } from '@/hooks/useDeals';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RecentDealsCard } from '@/components/dashboard/RecentDealsCard';
import { RecentPortfolioCard } from '@/components/dashboard/RecentPortfolioCard';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';
import { RemindersWidget } from '@/components/reminders/RemindersWidget';

export default function Dashboard() {
  const { deals, loading: dealsLoading, dealStats } = useDeals();
  const { companies: portfolioCompanies, loading: portfolioLoading } = usePortfolioCompanies();

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

      <DashboardMetrics
        activeDeals={dealStats.activeDeals}
        portfolioCount={portfolioCompanies?.length || 0}
        totalDeals={dealStats.totalDeals}
        totalInvested={totalInvested}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RecentDealsCard deals={deals?.slice(0, 5) || []} />
          <RemindersWidget />
        </div>
        <div className="space-y-6">
          <RecentPortfolioCard 
            companies={portfolioCompanies?.slice(0, 5) || []} 
            onViewDetails={() => {}} 
          />
          <DashboardQuickActions />
        </div>
      </div>
    </div>
  );
}
