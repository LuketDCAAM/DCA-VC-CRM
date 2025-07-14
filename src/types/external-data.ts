
import { Database } from '@/integrations/supabase/types';

// External data types based on the new database schema
export type CompanyFundingRound = Database['public']['Tables']['company_funding_rounds']['Row'];
export type ExternalInvestor = Database['public']['Tables']['external_investors']['Row'];
export type APISyncLog = Database['public']['Tables']['api_sync_logs']['Row'];
export type APIConfiguration = Database['public']['Tables']['api_configurations']['Row'];

// API provider types
export type APIProvider = 'crunchbase' | 'linkedin' | 'apollo' | 'clearbit';

// External API response interfaces
export interface CrunchbaseCompanyData {
  name: string;
  description?: string;
  website?: string;
  linkedin_url?: string;
  founded_year?: number;
  headquarters_location?: string;
  employee_count_range?: string;
  total_funding_raised?: number;
  last_funding_date?: string;
  company_type?: string;
  funding_rounds?: {
    round_type: string;
    amount_raised?: number;
    funding_date?: string;
    lead_investors?: string[];
    participating_investors?: string[];
    valuation_pre_money?: number;
    valuation_post_money?: number;
  }[];
}

export interface LinkedInCompanyData {
  name: string;
  description?: string;
  website?: string;
  employee_count_range?: string;
  headquarters_location?: string;
  company_type?: string;
}

export interface ExternalDataSyncResult {
  success: boolean;
  provider: APIProvider;
  data?: any;
  error?: string;
  records_processed: number;
  records_updated: number;
}

export interface APIConfigurationInput {
  provider: APIProvider;
  api_key: string;
  base_url?: string;
  rate_limit_per_minute?: number;
  is_active?: boolean;
}
