
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Deal } from '@/types/deal';
import { formatCurrency, getDealScoreColor } from './tableUtils';

interface FinancialCellProps {
  deal: Deal;
  type: 'roundSize' | 'dealScore';
}

export function FinancialCell({ deal, type }: FinancialCellProps) {
  if (type === 'roundSize') {
    return (
      <TableCell>
        <div className="font-medium text-foreground">
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
              <p>Post-money valuation: {formatCurrency(deal.post_money_valuation)}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    );
  }

  return (
    <TableCell>
      {deal.deal_score ? (
        <div className="flex items-center gap-1">
          <span className={`font-bold text-lg ${getDealScoreColor(deal.deal_score)}`}>
            {deal.deal_score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </TableCell>
  );
}
