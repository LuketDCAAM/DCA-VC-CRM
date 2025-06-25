
import { Database } from '@/integrations/supabase/types';

// Export canonical enum types directly from your Supabase generated types
export type PipelineStage = Database['public']['Enums']['pipeline_stage'];
export type RoundStage = Database['public']['Enums']['round_stage'];
export type CompanyStatus = Database['public']['Enums']['company_status'];
export type InvestmentStage = Database['public']['Enums']['investment_stage'];
export type UserStatus = Database['public']['Enums']['user_status'];
export type AppRole = Database['public']['Enums']['app_role'];

// Base type from Supabase for the deals table row
type DealRow = Database['public']['Tables']['deals']['Row'];

// THIS IS THE MOST IMPORTANT INTERFACE for resolving the "Property 'X' does not exist on type 'Deal'" errors.
// It explicitly defines the Deal interface with all properties from the Supabase deals table
export interface Deal {
  id: string;
  company_name: string;
  pipeline_stage: PipelineStage;
  round_stage: RoundStage | null;
  round_size: number | null;
  post_money_valuation: number | null;
  revenue: number | null;
  location: string | null;
  website: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  last_call_date: string | null;
  tags: string[] | null;
  relationship_owner: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deal_score: number | null;
  source_date: string | null;
  sector: string | null;
  description: string | null;
  deal_source: string | null;
  deal_lead: string | null;
}

// You can also create types for Insert and Update operations for consistency:
export type DealInsert = Database['public']['Tables']['deals']['Insert'];
export type DealUpdate = Database['public']['Tables']['deals']['Update'];

// Define other common table types if you frequently interact with them, e.g.:
// export interface Investor extends Database['public']['Tables']['investors']['Row'] {}
// export interface PortfolioCompany extends Database['public']['Tables']['portfolio_companies']['Row'] {}
// export interface CallNote extends Database['public']['Tables']['call_notes']['Row'] {}
