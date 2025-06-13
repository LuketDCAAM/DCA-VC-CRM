import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { PortfolioDetailDialog } from '@/components/portfolio/PortfolioDetailDialog';
import { RemindersWidget } from '@/components/reminders/RemindersWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Dashboard() {
  const { deals, loading: dealsLoading } = useDeals();
  const { companies, loading: companiesLoading } = usePortfolioCompanies();
  const navigate = useNavigate();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-xs text-muted-foreground">deals in pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">active investments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInvested > 0 ? formatCurrency(totalInvested) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">across portfolio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Deals</CardTitle>
                  <CardDescription>Latest updates in your pipeline</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/deals')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentDeals.length > 0 ? (
                  <div className="space-y-4">
                    {recentDeals.map((deal) => (
                      <div key={deal.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{deal.company_name}</h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {deal.pipeline_stage}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {deal.round_stage && `${deal.round_stage} • `}
                          Updated {new Date(deal.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No deals yet. Start by adding your first deal!</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Portfolio Updates</CardTitle>
                  <CardDescription>Latest portfolio company activity</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/portfolio')}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {recentCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {recentCompanies.map((company) => (
                      <div 
                        key={company.id} 
                        className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleViewCompanyDetails(company)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{company.company_name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            company.status === 'Active' ? 'bg-green-100 text-green-800' :
                            company.status === 'Exited' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {company.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {company.investments.length} investment{company.investments.length !== 1 ? 's' : ''} • 
                          Updated {new Date(company.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No portfolio companies yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reminders Widget */}
        <div>
          <RemindersWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => navigate('/deals')} className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Add New Deal
            </Button>
            <Button onClick={() => navigate('/portfolio')} variant="outline" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Add Portfolio Company
            </Button>
            <Button onClick={() => navigate('/investors')} variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Add Investor
            </Button>
            <Button onClick={() => navigate('/contacts')} variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

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
