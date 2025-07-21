
import React from 'react';
import { InvestmentActions } from './investment/InvestmentActions';
import { InvestmentCard } from './investment/InvestmentCard';
import { useInvestmentOperations } from './investment/useInvestmentOperations';

interface Investment {
  id: string;
  investment_date: string;
  amount_invested: number;
  post_money_valuation: number | null;
  price_per_share: number | null;
  revenue_at_investment: number | null;
  ownership_percentage: number | null;
}

interface InvestmentEditFormProps {
  companyId: string;
  investments: Investment[];
  onSave: () => void;
  onCancel: () => void;
}

export function InvestmentEditForm({ companyId, investments, onSave, onCancel }: InvestmentEditFormProps) {
  // Convert investments to display format (cents to dollars for editing)
  const [editingInvestments, setEditingInvestments] = React.useState(() =>
    investments.map(inv => ({
      ...inv,
      // Convert from cents to dollars for display
      amount_invested: inv.amount_invested / 100,
      post_money_valuation: inv.post_money_valuation ? inv.post_money_valuation / 100 : null,
      price_per_share: inv.price_per_share ? inv.price_per_share / 100 : null,
      revenue_at_investment: inv.revenue_at_investment ? inv.revenue_at_investment / 100 : null,
    }))
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync editing investments with props when investments change
  React.useEffect(() => {
    setEditingInvestments(investments.map(inv => ({
      ...inv,
      // Convert from cents to dollars for display
      amount_invested: inv.amount_invested / 100,
      post_money_valuation: inv.post_money_valuation ? inv.post_money_valuation / 100 : null,
      price_per_share: inv.price_per_share ? inv.price_per_share / 100 : null,
      revenue_at_investment: inv.revenue_at_investment ? inv.revenue_at_investment / 100 : null,
    })));
  }, [investments]);

  const { addNewInvestment, removeInvestment, saveInvestments } = useInvestmentOperations(companyId, onSave);

  const handleAddNew = () => {
    const newInvestment = addNewInvestment();
    setEditingInvestments([...editingInvestments, newInvestment]);
  };

  const handleRemove = async (investmentId: string) => {
    await removeInvestment(investmentId, editingInvestments, setEditingInvestments);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await saveInvestments(editingInvestments);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateInvestment = (index: number, field: keyof Investment, value: any) => {
    const updated = [...editingInvestments];
    updated[index] = { ...updated[index], [field]: value };
    setEditingInvestments(updated);
  };

  return (
    <div className="space-y-6">
      <InvestmentActions
        onSave={handleSave}
        onCancel={onCancel}
        onAddNew={handleAddNew}
        isSubmitting={isSubmitting}
      />

      <div className="space-y-4">
        {editingInvestments.map((investment, index) => (
          <InvestmentCard
            key={investment.id}
            investment={investment}
            index={index}
            onUpdate={updateInvestment}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
