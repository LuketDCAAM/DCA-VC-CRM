import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, TrendingUp, Calendar, Eye } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { PortfolioCompany } from '@/hooks/usePortfolioCompanies';

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

interface PortfolioCardProps {
  company: PortfolioCompany;
  onViewDetails?: (company: PortfolioCompany) => void;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Convert from cents
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

export function PortfolioCard({ company, onViewDetails }: PortfolioCardProps) {
  const totalInvested = company.investments.reduce((sum, inv) => sum + inv.amount_invested, 0);
  const latestInvestment = company.investments.sort((a, b) => 
    new Date(b.investment_date).getTime() - new Date(a.investment_date).getTime()
  )[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {company.company_name}
            </CardTitle>
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
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={() => onViewDetails(company)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Invested</p>
            <p className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Ownership</p>
            <p className="text-sm font-medium">
              {formatPercentage(company.current_valuation?.current_ownership_percentage)}
            </p>
          </div>
        </div>

        {company.current_valuation?.last_round_post_money_valuation && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">Last Round Valuation:</span>
            <span className="font-medium">
              {formatCurrency(company.current_valuation.last_round_post_money_valuation)}
            </span>
          </div>
        )}

        {latestInvestment && (
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
            <Calendar className="h-4 w-4" />
            <span>Latest Investment:</span>
            <span>{new Date(latestInvestment.investment_date).toLocaleDateString()}</span>
          </div>
        )}

        <div className="text-xs text-gray-500">
          {company.investments.length} investment{company.investments.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
