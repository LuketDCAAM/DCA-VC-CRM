

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

// Enhanced Deal type - just use the base type directly since it already includes all the fields
// The database migration has already added all the external data fields to the deals table
export interface Deal extends BaseDeal {
  // No need to override anything - BaseDeal already has the correct types from the database
}

// You can also create types for Insert and Update operations for consistency:
export type DealInsert = Database['public']['Tables']['deals']['Insert'];
export type DealUpdate = Database['public']['Tables']['deals']['Update'];

// Define other common table types if you frequently interact with them, e.g.:
// export interface Investor extends Database['public']['Tables']['investors']['Row'] {}
// export interface PortfolioCompany extends Database['public']['Tables']['portfolio_companies']['Row'] {}
// export interface CallNote extends Database['public']['Tables']['call_notes']['Row'] {}

