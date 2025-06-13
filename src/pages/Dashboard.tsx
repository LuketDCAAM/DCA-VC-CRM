
import React, { useState } from 'react';
import { useDeals } from '@/hooks/useDeals';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { PortfolioDetailDialog } from '@/components/portfolio/PortfolioDetailDialog';
import { RemindersWidget } from '@/components/reminders/RemindersWidget';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RecentDealsCard } from '@/components/dashboard/RecentDealsCard';
import { RecentPortfolioCard } from '@/components/dashboard/RecentPortfolioCard';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';

export default function Dashboard() {
  const { deals, loading: dealsLoading } = useDeals();
  const { companies, loading: companiesLoading } = usePortfolioCompanies();
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Calculate metrics
  const activeDeals = deals.filter(deal => 
    !['Invested', 'Passed'].includes(deal.pipeline_stage)
  ).length;

  const totalInvested = companies.reduce((sum, company) => 
    sum + company.investments.reduce((invSum, inv) => invSum + inv.amount_invested, 0), 0
  );

  const recentDeals = deals
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  const recentCompanies = companies
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  const handleViewCompanyDetails = (company: any) => {
    setSelectedCompany(company);
    setDetailDialogOpen(true);
  };

  if (dealsLoading || companiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your VC deal flow and portfolio
          </p>
        </div>

        {/* Metrics */}
        <DashboardMetrics
          activeDeals={activeDeals}
          portfolioCount={companies.length}
          totalDeals={deals.length}
          totalInvested={totalInvested}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Takes 3/4 width on xl screens */}
          <div className="xl:col-span-3 space-y-6">
            {/* Recent Activity Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentDealsCard deals={recentDeals} />
              <RecentPortfolioCard 
                companies={recentCompanies}
                onViewDetails={handleViewCompanyDetails}
              />
            </div>
            
            {/* Quick Actions */}
            <DashboardQuickActions />
          </div>

          {/* Right Column - Takes 1/4 width on xl screens */}
          <div className="xl:col-span-1">
            <RemindersWidget />
          </div>
        </div>

        <PortfolioDetailDialog
          company={selectedCompany}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onCompanyUpdated={() => {
            // Refetch companies if needed
          }}
        />
      </div>
    </div>
  );
}
