
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
// Import PipelineStage, RoundStage, and DealInsert from your canonical types file
import { PipelineStage, RoundStage, DealInsert } from '@/types/deal'; 

// These arrays should ideally derive from your Supabase generated types if you want to avoid manual sync.
// For now, they are explicitly typed to match the Supabase enum for consistency.
const pipelineStages: PipelineStage[] = [
  'Inactive',
  'Initial Review',
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Memo',       // Using 'Memo' to match Supabase enum
  'Legal Review',
  'Invested',
  'Passed'
];

const roundStages: RoundStage[] = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Bridge',
  'Growth'
];

export interface AddDealFormData {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  location: string;
  sector: string;
  description: string;
  pipeline_stage: PipelineStage; 
  round_stage: RoundStage | ''; 
  round_size: string; 
  post_money_valuation: string; 
  revenue: string; 
  deal_score: number | null;
  deal_lead: string;
  deal_source: string;
  source_date: string;
}

export const defaultFormData: AddDealFormData = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  location: '',
  sector: '',
  description: '',
  pipeline_stage: 'Inactive', // Initialize to a valid enum member
  round_stage: '',
  round_size: '',
  post_money_valuation: '',
  revenue: '',
  deal_score: null,
  deal_lead: '',
  deal_source: '',
  source_date: '',
};

export function useAddDeal() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const parseAndScaleCurrency = (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : Math.round(num * 100); 
  };

  const createDeal = async (formData: AddDealFormData, onSuccess: () => void) => {
    if (!user) return;

    setLoading(true);

    try {
      const dealData: DealInsert = { // Use DealInsert type for consistency
        company_name: formData.company_name,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website: formData.website || null,
        location: formData.location || null,
        sector: formData.sector || null,
        description: formData.description || null,
        pipeline_stage: formData.pipeline_stage,
        round_stage: formData.round_stage === '' ? null : formData.round_stage, 
        round_size: parseAndScaleCurrency(formData.round_size),
        post_money_valuation: parseAndScaleCurrency(formData.post_money_valuation),
        revenue: parseAndScaleCurrency(formData.revenue),
        deal_score: formData.deal_score,
        deal_lead: formData.deal_lead || null,
        deal_source: formData.deal_source || null,
        source_date: formData.source_date || null,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('deals')
        .insert([dealData]); 

      if (error) throw error;

      toast({
        title: "Deal created successfully",
        description: `${formData.company_name} has been added to your pipeline.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error creating deal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createDeal,
    pipelineStages, 
    roundStages,    
  };
}
