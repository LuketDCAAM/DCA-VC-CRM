
import { Database } from '@/integrations/supabase/types';

// Export canonical enum types directly from your Supabase generated types
export type PipelineStage = Database['public']['Enums']['pipeline_stage'];
export type RoundStage = Database['public']['Enums']['round_stage'];
export type CompanyStatus = Database['public']['Enums']['company_status'];
export type InvestmentStage = Database['public']['Enums']['investment_stage'];
export type UserStatus = Database['public']['Enums']['user_status'];
export type AppRole = Database['public']['Enums']['app_role'];

// Base Deal type from database
export type BaseDeal = Database['public']['Tables']['deals']['Row'];

// Enhanced Deal type with external data fields
export interface Deal extends BaseDeal {
  // External data fields from the new columns
  linkedin_url?: string | null;
  crunchbase_url?: string | null;
  total_funding_raised?: number | null;
  last_funding_date?: string | null;
  employee_count_range?: string | null;
  founded_year?: number | null;
  headquarters_location?: string | null;
  company_type?: string | null;
  external_data_last_synced?: string | null;
  external_data_sync_status?: string | null;
}

// You can also create types for Insert and Update operations for consistency:
export type DealInsert = Database['public']['Tables']['deals']['Insert'];
export type DealUpdate = Database['public']['Tables']['deals']['Update'];

// Define other common table types if you frequently interact with them, e.g.:
// export interface Investor extends Database['public']['Tables']['investors']['Row'] {}
// export interface PortfolioCompany extends Database['public']['Tables']['portfolio_companies']['Row'] {}
// export interface CallNote extends Database['public']['Tables']['call_notes']['Row'] {}
