
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

const investmentSchema = z.object({
  investment_date: z.string().min(1, 'Investment date is required'),
  amount_invested: z.number().min(0, 'Amount must be positive'),
  post_money_valuation: z.number().nullable(),
  price_per_share: z.number().nullable(),
  revenue_at_investment: z.number().nullable(),
  ownership_percentage: z.number().min(0).max(1).nullable(),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

export function InvestmentEditForm({ companyId, investments, onSave, onCancel }: InvestmentEditFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingInvestments, setEditingInvestments] = React.useState(investments);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const addNewInvestment = () => {
    const newInvestment: Investment = {
      id: `temp-${Date.now()}`,
      investment_date: new Date().toISOString().split('T')[0],
      amount_invested: 0,
      post_money_valuation: null,
      price_per_share: null,
      revenue_at_investment: null,
      ownership_percentage: null,
    };
    setEditingInvestments([...editingInvestments, newInvestment]);
  };

  const removeInvestment = async (investmentId: string) => {
    if (investmentId.startsWith('temp-')) {
      setEditingInvestments(editingInvestments.filter(inv => inv.id !== investmentId));
      return;
    }

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId);

      if (error) throw error;

      setEditingInvestments(editingInvestments.filter(inv => inv.id !== investmentId));
      toast({
        title: "Investment deleted",
        description: "The investment has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting investment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      // Handle updates and inserts
      for (const investment of editingInvestments) {
        const investmentData = {
          portfolio_company_id: companyId,
          investment_date: investment.investment_date,
          amount_invested: investment.amount_invested * 100, // Convert to cents
          post_money_valuation: investment.post_money_valuation ? investment.post_money_valuation * 100 : null,
          price_per_share: investment.price_per_share ? investment.price_per_share * 100 : null,
          revenue_at_investment: investment.revenue_at_investment ? investment.revenue_at_investment * 100 : null,
          ownership_percentage: investment.ownership_percentage,
        };

        if (investment.id.startsWith('temp-')) {
          // Insert new investment
          const { error } = await supabase
            .from('investments')
            .insert(investmentData);
          
          if (error) throw error;
        } else {
          // Update existing investment
          const { error } = await supabase
            .from('investments')
            .update(investmentData)
            .eq('id', investment.id);
          
          if (error) throw error;
        }
      }

      toast({
        title: "Investments updated",
        description: "Investment data has been successfully updated.",
      });

      queryClient.invalidateQueries({ queryKey: ['portfolioCompanies'] });
      onSave();
    } catch (error: any) {
      toast({
        title: "Error updating investments",
        description: error.message,
        variant: "destructive",
      });
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Edit Investments</h3>
        <div className="flex gap-2">
          <Button onClick={addNewInvestment} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {editingInvestments.map((investment, index) => (
          <Card key={investment.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">
                  {investment.id.startsWith('temp-') ? 'New Investment' : 'Investment Round'}
                </CardTitle>
                <Button
                  onClick={() => removeInvestment(investment.id)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Investment Date *</label>
                  <Input
                    type="date"
                    value={investment.investment_date}
                    onChange={(e) => updateInvestment(index, 'investment_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount Invested *</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={investment.amount_invested / 100}
                    onChange={(e) => updateInvestment(index, 'amount_invested', parseFloat(e.target.value) * 100 || 0)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Post-Money Valuation</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={investment.post_money_valuation ? investment.post_money_valuation / 100 : ''}
                    onChange={(e) => updateInvestment(index, 'post_money_valuation', e.target.value ? parseFloat(e.target.value) * 100 : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price per Share</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={investment.price_per_share ? investment.price_per_share / 100 : ''}
                    onChange={(e) => updateInvestment(index, 'price_per_share', e.target.value ? parseFloat(e.target.value) * 100 : null)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Revenue at Investment</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={investment.revenue_at_investment ? investment.revenue_at_investment / 100 : ''}
                    onChange={(e) => updateInvestment(index, 'revenue_at_investment', e.target.value ? parseFloat(e.target.value) * 100 : null)}
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
                    onChange={(e) => updateInvestment(index, 'ownership_percentage', e.target.value ? parseFloat(e.target.value) / 100 : null)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
