
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
// Import PipelineStage and RoundStage from your centralized types file if they are globally defined there.
// For now, deriving from here as per the original file structure, but it's better to have one source of truth.
import { PipelineStage, RoundStage } from '@/types/deal'; // Ensure these types are imported from where your canonical types are defined

// These arrays should ideally derive directly from your Supabase generated types
// (Database['public']['Enums']['pipeline_stage']) for consistency.
// Based on the error messages, 'Initial Review' and 'Term Sheet' are expected,
// and 'Memo' might not be in the Supabase enum.
// PLEASE VERIFY THESE STAGES AGAINST YOUR SUPABASE ENUMS (src/integrations/supabase/types.ts)!
const pipelineStages: PipelineStage[] = [
  'Inactive',
  'Initial Review', // Added based on error message
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  // 'Memo', // Removed based on error message indicating it's not in the Supabase enum
  'Legal Review',
  'Term Sheet', // Added based on error message
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
  pipeline_stage: PipelineStage; // Use the imported PipelineStage type
  round_stage: RoundStage | ''; // Use the imported RoundStage type
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
  // FIX: Initialize pipeline_stage to a valid enum member, not an empty string
  pipeline_stage: 'Inactive', 
  round_stage: '', // Keep as is if empty string is meant to be 'null' before insert
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
      // Ensure the object keys and types match your 'deals' table in Supabase
      const dealData: {
        company_name: string;
        contact_name: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        website: string | null;
        location: string | null;
        sector: string | null;
        description: string | null;
        pipeline_stage: PipelineStage; // Should be the Supabase enum type
        round_stage: RoundStage | null; // Should be the Supabase enum type
        round_size: number | null;
        post_money_valuation: number | null;
        revenue: number | null;
        deal_score: number | null;
        deal_lead: string | null;
        deal_source: string | null;
        source_date: string | null;
        created_by: string;
      } = {
        company_name: formData.company_name,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website: formData.website || null,
        location: formData.location || null,
        sector: formData.sector || null,
        description: formData.description || null,
        pipeline_stage: formData.pipeline_stage,
        // Cast to RoundStage or null, ensuring it matches the DB column type
        round_stage: formData.round_stage ? (formData.round_stage as RoundStage) : null, 
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
        // FIX: Supabase insert expects an array of objects, even for a single insert
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
    pipelineStages, // These are derived from the local const array, not Supabase
    roundStages,    // These are derived from the local const array, not Supabase
  };
}
