
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Investment {
  id: string;
  investment_date: string;
  amount_invested: number;
  post_money_valuation: number | null;
  price_per_share: number | null;
  revenue_at_investment: number | null;
  ownership_percentage: number | null;
}

export function useInvestmentOperations(companyId: string, onSave: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addNewInvestment = (): Investment => {
    return {
      id: `temp-${Date.now()}`,
      investment_date: new Date().toISOString().split('T')[0],
      amount_invested: 0,
      post_money_valuation: null,
      price_per_share: null,
      revenue_at_investment: null,
      ownership_percentage: null,
    };
  };

  const removeInvestment = async (
    investmentId: string,
    editingInvestments: Investment[],
    setEditingInvestments: React.Dispatch<React.SetStateAction<Investment[]>>
  ) => {
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

  const saveInvestments = async (editingInvestments: Investment[]) => {
    try {
      for (const investment of editingInvestments) {
        const investmentData = {
          portfolio_company_id: companyId,
          investment_date: investment.investment_date,
          amount_invested: Math.round(investment.amount_invested * 100),
          post_money_valuation: investment.post_money_valuation ? Math.round(investment.post_money_valuation * 100) : null,
          price_per_share: investment.price_per_share ? Math.round(investment.price_per_share * 100) : null,
          revenue_at_investment: investment.revenue_at_investment ? Math.round(investment.revenue_at_investment * 100) : null,
          ownership_percentage: investment.ownership_percentage,
        };

        if (investment.id.startsWith('temp-')) {
          const { error } = await supabase
            .from('investments')
            .insert(investmentData);
          
          if (error) throw error;
        } else {
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
    }
  };

  return {
    addNewInvestment,
    removeInvestment,
    saveInvestments,
  };
}
