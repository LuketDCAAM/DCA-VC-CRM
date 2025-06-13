
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
      <div className="p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Overview of your VC deal flow and portfolio</p>
      </div>

      <DashboardMetrics
        activeDeals={activeDeals}
        portfolioCount={companies.length}
        totalDeals={deals.length}
        totalInvested={totalInvested}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentDealsCard deals={recentDeals} />
            <RecentPortfolioCard 
              companies={recentCompanies}
              onViewDetails={handleViewCompanyDetails}
            />
          </div>
        </div>

        {/* Reminders Widget */}
        <div>
          <RemindersWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <DashboardQuickActions />

      <PortfolioDetailDialog
        company={selectedCompany}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onCompanyUpdated={() => {
          // Refetch companies if needed
        }}
      />
    </div>
  );
}
