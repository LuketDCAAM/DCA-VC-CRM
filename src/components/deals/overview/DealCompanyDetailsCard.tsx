
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
        {(deal.city || deal.state_province || deal.country) && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Location</div>
            <div className="space-y-1">
              {deal.city && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">City:</span>
                  <span className="font-medium">{deal.city}</span>
                </div>
              )}
              {deal.state_province && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">State:</span>
                  <span className="font-medium">{deal.state_province}</span>
                </div>
              )}
              {deal.country && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Country:</span>
                  <span className="font-medium">{deal.country}</span>
                </div>
              )}
            </div>
          </div>
        )}
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
