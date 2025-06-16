
import React from 'react';
import { DollarSign, Star } from 'lucide-react';
import { Deal } from '@/types/deal';
import { formatCurrency } from './dealCardUtils';

interface DealCardFinancialsProps {
  deal: Deal;
}

export function DealCardFinancials({ deal }: DealCardFinancialsProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
        <div>
          <p className="text-xs text-gray-500 mb-1">Round Size</p>
          <p className="text-sm font-medium">{formatCurrency(deal.round_size)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Valuation</p>
          <p className="text-sm font-medium">{formatCurrency(deal.post_money_valuation)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Deal Score</p>
          <div className="flex items-center text-sm font-medium">
            <Star className={`h-4 w-4 mr-1 ${deal.deal_score && deal.deal_score > 50 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            {deal.deal_score ?? 'N/A'}
          </div>
        </div>
      </div>

      {deal.revenue && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-gray-600">Revenue:</span>
          <span className="font-medium">{formatCurrency(deal.revenue)}</span>
        </div>
      )}
    </>
  );
}
