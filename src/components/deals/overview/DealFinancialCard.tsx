
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealFinancialCardProps {
  deal: Deal;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

export function DealFinancialCard({ deal }: DealFinancialCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">Round Size</div>
          <div className="font-medium">{formatCurrency(deal.round_size)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Post-Money Valuation</div>
          <div className="font-medium">{formatCurrency(deal.post_money_valuation)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Revenue</div>
          <div className="font-medium">{formatCurrency(deal.revenue)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
