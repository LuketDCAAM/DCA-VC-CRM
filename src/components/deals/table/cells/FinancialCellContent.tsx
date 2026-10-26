
import React from 'react';
import { DollarSign, Star } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, getDealScoreColor } from '../tableUtils';

interface FinancialCellContentProps {
  deal: Deal;
  type: 'round_size' | 'post_money_valuation' | 'revenue' | 'deal_score' | 'revenue_multiple';
}

const MoneyLine = ({ value }: { value: number | null | undefined }) => (
  <div className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-foreground">
    <DollarSign className="h-3 w-3 text-muted-foreground" />
    {formatCurrency(value)}
  </div>
);


export function FinancialCellContent({ deal, type }: FinancialCellContentProps) {
  switch (type) {
    case 'round_size': {
      const line = <MoneyLine value={deal.round_size} />;
      if (!deal.post_money_valuation) return line;
      return (
        <Tooltip>
          <TooltipTrigger asChild>{line}</TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <p>Round size: {formatCurrency(deal.round_size)}</p>
            <p>Post-money valuation: {formatCurrency(deal.post_money_valuation)}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    case 'post_money_valuation':
    case 'revenue':
      return <MoneyLine value={type === 'post_money_valuation' ? deal.post_money_valuation : deal.revenue} />;

    case 'deal_score':
      return deal.deal_score ? (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          <span className={`text-sm font-bold ${getDealScoreColor(deal.deal_score)}`}>{deal.deal_score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'revenue_multiple':
      if (deal.post_money_valuation && deal.revenue && Number(deal.revenue) > 0) {
        const multiple = Number(deal.post_money_valuation) / Number(deal.revenue);
        return <div className="whitespace-nowrap text-sm font-semibold text-foreground">{multiple.toFixed(1)}x</div>;
      }
      return <span className="text-muted-foreground text-sm">-</span>;

    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
