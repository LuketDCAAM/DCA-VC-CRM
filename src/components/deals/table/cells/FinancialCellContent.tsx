
import React from 'react';
import { DollarSign, Star } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, getDealScoreColor } from '../tableUtils';

interface FinancialCellContentProps {
  deal: Deal;
  type: 'round_size' | 'post_money_valuation' | 'revenue' | 'deal_score' | 'revenue_multiple';
}

export function FinancialCellContent({ deal, type }: FinancialCellContentProps) {
  switch (type) {
    case 'round_size':
      return (
        <div className="space-y-0.5">
          <div className="font-semibold text-sm text-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            {formatCurrency(deal.round_size)}
          </div>
          {deal.post_money_valuation && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground cursor-help">
                  Val: {formatCurrency(deal.post_money_valuation)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Post-money valuation</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );

    case 'post_money_valuation':
    case 'revenue':
      const value = type === 'post_money_valuation' ? deal.post_money_valuation : deal.revenue;
      return (
        <div className="font-semibold text-sm text-foreground flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          {formatCurrency(value)}
        </div>
      );

    case 'deal_score':
      return deal.deal_score ? (
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span className={`font-bold text-base ${getDealScoreColor(deal.deal_score)}`}>
            {deal.deal_score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'revenue_multiple':
      if (deal.post_money_valuation && deal.revenue && Number(deal.revenue) > 0) {
        const multiple = Number(deal.post_money_valuation) / Number(deal.revenue);
        return (
          <div className="font-semibold text-sm text-foreground">
            {multiple.toFixed(1)}x
          </div>
        );
      }
      return <span className="text-muted-foreground text-sm">-</span>;

    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
