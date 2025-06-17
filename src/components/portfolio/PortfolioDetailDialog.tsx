import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Building2, DollarSign, TrendingUp, Calendar, Users, FileText } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { PortfolioEditForm } from './PortfolioEditForm';

type CompanyStatus = Database['public']['Enums']['company_status'];

interface Investment {
  id: string;
  investment_date: string;
  amount_invested: number;
  post_money_valuation: number | null;
  price_per_share: number | null;
  revenue_at_investment: number | null;
  ownership_percentage: number | null;
}

interface PortfolioCompany {
  id: string;
  company_name: string;
  description: string | null;
  status: CompanyStatus;
  tags: string[] | null;
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
  investments: Investment[];
  current_valuation: {
    last_round_post_money_valuation: number | null;
    last_round_price_per_share: number | null;
    current_ownership_percentage: number | null;
  } | null;
}

interface PortfolioDetailDialogProps {
  company: PortfolioCompany | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyUpdated?: () => void;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

const formatPercentage = (percentage: number | null) => {
  if (!percentage) return 'N/A';
  return `${(percentage * 100).toFixed(2)}%`;
};

const getStatusColor = (status: CompanyStatus) => {
  const colors = {
    'Active': 'bg-green-100 text-green-800',
    'Exited': 'bg-blue-100 text-blue-800',
    'Dissolved': 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export function PortfolioDetailDialog({ company, open, onOpenChange, onCompanyUpdated }: PortfolioDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!company) return null;

  const handleSave = () => {
    setIsEditing(false);
    if (onCompanyUpdated) {
      onCompanyUpdated();
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const totalInvested = company.investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const latestInvestment = company.investments.sort((a, b) => 
    new Date(b.investment_date).getTime() - new Date(a.investment_date).getTime()
  )[0];

  const currentValue = company.current_valuation?.last_round_post_money_valuation;
  const originalValue = company.investments.find(inv => inv.post_money_valuation)?.post_money_valuation;
  const valueMultiple = currentValue && originalValue ? currentValue / originalValue : null;

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PortfolioEditForm
            company={company}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {company.company_name}
              </DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className={getStatusColor(company.status)}>
                  {company.status}
                </Badge>
                {company.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Company
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Invested
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                  <p className="text-xs text-gray-500">
                    {company.investments.length} investment{company.investments.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Current Ownership
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(company.current_valuation?.current_ownership_percentage)}
                  </div>
                  <p className="text-xs text-gray-500">of company equity</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Current Valuation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(company.current_valuation?.last_round_post_money_valuation)}
                  </div>
                  <p className="text-xs text-gray-500">post-money valuation</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">{company.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Relationship Owner</label>
                    <p className="mt-1">{company.relationship_owner || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Investment Date</label>
                    <p className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {latestInvestment ? new Date(latestInvestment.investment_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1">{new Date(company.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {company.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1">{company.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investments" className="space-y-4">
            {company.investments.length > 0 ? (
              company.investments
                .sort((a, b) => new Date(b.investment_date).getTime() - new Date(a.investment_date).getTime())
                .map((investment) => (
                  <Card key={investment.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">Investment Round</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(investment.investment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {formatCurrency(investment.amount_invested)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-500">Post-Money Valuation</label>
                          <p>{formatCurrency(investment.post_money_valuation)}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-500">Price per Share</label>
                          <p>{formatCurrency(investment.price_per_share)}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-500">Ownership</label>
                          <p>{formatPercentage(investment.ownership_percentage)}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-500">Revenue at Investment</label>
                          <p>{formatCurrency(investment.revenue_at_investment)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No investment records found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Investment Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Value Multiple</label>
                    <p className="text-xl font-bold">
                      {valueMultiple ? `${valueMultiple.toFixed(2)}x` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Value</label>
                    <p className="text-lg font-semibold">
                      {company.current_valuation?.current_ownership_percentage && company.current_valuation?.last_round_post_money_valuation
                        ? formatCurrency(company.current_valuation.current_ownership_percentage * company.current_valuation.last_round_post_money_valuation)
                        : 'N/A'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Time Since Investment</label>
                    <p className="text-lg font-semibold">
                      {latestInvestment 
                        ? Math.ceil((new Date().getTime() - new Date(latestInvestment.investment_date).getTime()) / (1000 * 3600 * 24 * 365.25)) + ' years'
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Investment Status</label>
                    <p className="text-lg font-semibold">{company.status}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-blue-200 pl-4 py-2">
                    <p className="font-medium">Company Added</p>
                    <p className="text-sm text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {company.investments.map((investment) => (
                    <div key={investment.id} className="border-l-2 border-green-200 pl-4 py-2">
                      <p className="font-medium">Investment Made</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(investment.amount_invested)} invested on{' '}
                        {new Date(investment.investment_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  <div className="border-l-2 border-gray-200 pl-4 py-2">
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm text-gray-500">
                      {new Date(company.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
