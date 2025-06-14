
import { Database } from '@/integrations/supabase/types';

export type PipelineStage = Database['public']['Enums']['pipeline_stage'];
export type RoundStage = Database['public']['Enums']['round_stage'];

export interface Deal {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  location: string | null;
  description: string | null;
  pipeline_stage: PipelineStage;
  round_stage: RoundStage | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  created_at: string;
  updated_at: string;
  deal_score: number | null;
  source_date: string | null;
  deal_source: string | null;
  deal_lead: string | null;
}
