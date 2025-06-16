
import React from 'react';
import { Deal } from '@/types/deal';
import { DealHeaderCard } from './overview/DealHeaderCard';
import { DealContactCard } from './overview/DealContactCard';
import { DealCompanyDetailsCard } from './overview/DealCompanyDetailsCard';
import { DealFinancialCard } from './overview/DealFinancialCard';
import { DealMetricsCard } from './overview/DealMetricsCard';
import { DealSourceCard } from './overview/DealSourceCard';

interface DealOverviewProps {
  deal: Deal;
}

export function DealOverview({ deal }: DealOverviewProps) {
  return (
    <div className="space-y-6">
      <DealHeaderCard deal={deal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DealContactCard deal={deal} />
        <DealCompanyDetailsCard deal={deal} />
        <DealFinancialCard deal={deal} />
        <DealMetricsCard deal={deal} />
        <DealSourceCard deal={deal} />
      </div>
    </div>
  );
}
