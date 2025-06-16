
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Tag } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealCompanyDetailsCardProps {
  deal: Deal;
}

export function DealCompanyDetailsCard({ deal }: DealCompanyDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deal.sector && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Sector</div>
            <div className="font-medium flex items-center gap-1">
              <Tag className="h-4 w-4 text-gray-400" />
              {deal.sector}
            </div>
          </div>
        )}
        {deal.description && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Description</div>
            <div className="text-sm">{deal.description}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
