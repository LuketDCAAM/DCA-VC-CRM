
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Investor } from '@/types/investor';

interface InvestorStatsProps {
  investors: Investor[];
}

export function InvestorStats({ investors }: InvestorStatsProps) {
    const totalInvestors = investors.length;
    const withContactInfo = investors.filter(i => i.contact_email || i.contact_phone).length;
    const firmInvestors = investors.filter(i => i.firm_name).length;
    const investorsWithCheckSize = investors.filter(i => i.average_check_size && i.average_check_size > 0);
    const avgCheckSize = investorsWithCheckSize.length > 0
        ? investorsWithCheckSize.reduce((sum, i) => sum + (i.average_check_size || 0), 0) / (investorsWithCheckSize.length)
        : 0;
    
    const formattedAvgCheckSize = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(avgCheckSize / 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Investors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvestors}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">With Contact Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{withContactInfo}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Firm Investors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{firmInvestors}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Avg Check Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {investorsWithCheckSize.length > 0 ? formattedAvgCheckSize : '$0'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
