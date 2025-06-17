
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { InvestmentFormFields } from './InvestmentFormFields';

interface Investment {
  id: string;
  investment_date: string;
  amount_invested: number;
  post_money_valuation: number | null;
  price_per_share: number | null;
  revenue_at_investment: number | null;
  ownership_percentage: number | null;
}

interface InvestmentCardProps {
  investment: Investment;
  index: number;
  onUpdate: (index: number, field: keyof Investment, value: any) => void;
  onRemove: (investmentId: string) => void;
}

export function InvestmentCard({ investment, index, onUpdate, onRemove }: InvestmentCardProps) {
  return (
    <Card key={investment.id}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">
            {investment.id.startsWith('temp-') ? 'New Investment' : 'Investment Round'}
          </CardTitle>
          <Button
            onClick={() => onRemove(investment.id)}
            variant="outline"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <InvestmentFormFields
          investment={investment}
          index={index}
          onUpdate={onUpdate}
        />
      </CardContent>
    </Card>
  );
}
