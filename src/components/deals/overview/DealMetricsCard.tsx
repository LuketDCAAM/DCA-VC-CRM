
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealMetricsCardProps {
  deal: Deal;
}

export function DealMetricsCard({ deal }: DealMetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Deal Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">Time in Pipeline</div>
          <div className="font-medium">
            {Math.ceil((new Date().getTime() - new Date(deal.created_at).getTime()) / (1000 * 3600 * 24))} days
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Last Updated</div>
          <div className="font-medium">
            {Math.ceil((new Date().getTime() - new Date(deal.updated_at).getTime()) / (1000 * 3600 * 24))} days ago
          </div>
        </div>
        {deal.round_size && deal.post_money_valuation && (
          <div>
            <div className="text-sm text-gray-500 mb-1">Dilution</div>
            <div className="font-medium">
              {((deal.round_size / deal.post_money_valuation) * 100).toFixed(2)}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
