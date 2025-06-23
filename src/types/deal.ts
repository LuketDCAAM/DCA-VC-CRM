import { Database } from '@/integrations/supabase/types';

// Export canonical enum types directly from your Supabase generated types
export type PipelineStage = Database['public']['Enums']['pipeline_stage'];
export type RoundStage = Database['public']['Enums']['round_stage'];
export type CompanyStatus = Database['public']['Enums']['company_status']; // Added for completeness if needed elsewhere
export type InvestmentStage = Database['public']['Enums']['investment_stage']; // Added for completeness if needed elsewhere
export type UserStatus = Database['public']['Enums']['user_status']; // Added for completeness if needed elsewhere
export type AppRole = Database['public']['Enums']['app_role']; // Added for completeness if needed elsewhere


// Define the Deal interface to precisely match the Supabase 'deals' table Row type
export interface Deal extends Database['public']['Tables']['deals']['Row'] {
  // All fields are already covered by Database['public']['Tables']['deals']['Row']
  // If you need additional client-side only fields, add them here.
  // For example, if you had a computed field not in the DB:
  // calculated_field?: string;
}

// You might also want to create types for Insert and Update operations
export type DealInsert = Database['public']['Tables']['deals']['Insert'];
export type DealUpdate = Database['public']['Tables']['deals']['Update'];

// Define other types if they are commonly used and represent a database row
// export interface Investor extends Database['public']['Tables']['investors']['Row'] {}
// export interface PortfolioCompany extends Database['public']['Tables']['portfolio_companies']['Row'] {}
// export interface CallNote extends Database['public']['Tables']['call_notes']['Row'] {}
