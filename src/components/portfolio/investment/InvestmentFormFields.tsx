
import React from 'react';
import { Input } from '@/components/ui/input';

interface Investment {
  id: string;
  investment_date: string;
  amount_invested: number;
  post_money_valuation: number | null;
  price_per_share: number | null;
  revenue_at_investment: number | null;
  ownership_percentage: number | null;
}

interface InvestmentFormFieldsProps {
  investment: Investment;
  index: number;
  onUpdate: (index: number, field: keyof Investment, value: any) => void;
}

export function InvestmentFormFields({ investment, index, onUpdate }: InvestmentFormFieldsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium">Investment Date *</label>
        <Input
          type="date"
          value={investment.investment_date}
          onChange={(e) => onUpdate(index, 'investment_date', e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Amount Invested *</label>
        <Input
          type="number"
          placeholder="0"
          value={investment.amount_invested || ''}
          onChange={(e) => onUpdate(index, 'amount_invested', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Post-Money Valuation</label>
        <Input
          type="number"
          placeholder="0"
          value={investment.post_money_valuation || ''}
          onChange={(e) => onUpdate(index, 'post_money_valuation', e.target.value ? parseFloat(e.target.value) : null)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Price per Share</label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={investment.price_per_share || ''}
          onChange={(e) => onUpdate(index, 'price_per_share', e.target.value ? parseFloat(e.target.value) : null)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Revenue at Investment</label>
        <Input
          type="number"
          placeholder="0"
          value={investment.revenue_at_investment || ''}
          onChange={(e) => onUpdate(index, 'revenue_at_investment', e.target.value ? parseFloat(e.target.value) : null)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Ownership Percentage</label>
        <Input
          type="number"
          step="0.01"
          max="100"
          placeholder="0.00"
          value={investment.ownership_percentage ? (investment.ownership_percentage * 100).toFixed(2) : ''}
          onChange={(e) => onUpdate(index, 'ownership_percentage', e.target.value ? parseFloat(e.target.value) / 100 : null)}
        />
      </div>
    </div>
  );
}
