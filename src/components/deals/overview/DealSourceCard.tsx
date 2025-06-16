
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealSourceCardProps {
  deal: Deal;
}

export function DealSourceCard({ deal }: DealSourceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Source Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deal.deal_lead && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Deal Lead</div>
            <div className="font-medium">{deal.deal_lead}</div>
          </div>
        )}
        {deal.deal_source && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Deal Source</div>
            <div className="font-medium">{deal.deal_source}</div>
          </div>
        )}
        {deal.source_date && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Source Date</div>
            <div className="font-medium">{new Date(deal.source_date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
