
import { Database } from '@/integrations/supabase/types';

// External data types - using type assertions since the types may not be fully generated yet
export type CompanyFundingRound = {
  id: string;
  deal_id: string;
  round_type: string;
  amount_raised?: number | null;
  funding_date?: string | null;
  lead_investors?: string[] | null;
  participating_investors?: string[] | null;
  valuation_pre_money?: number | null;
  valuation_post_money?: number | null;
  external_source: string;
  external_id?: string | null;
  created_at: string;
};

export type ExternalInvestor = {
  id: string;
  name: string;
  firm_name?: string | null;
  external_source: string;
  external_id?: string | null;
  profile_data?: any;
  created_at: string;
  updated_at: string;
};

export type APISyncLog = {
  id: string;
  deal_id?: string | null;
  api_provider: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  data_fetched?: any;
  error_message?: string | null;
  records_processed: number;
  records_updated: number;
  created_by: string;
};

export type APIConfiguration = {
  id: string;
  provider: string;
  api_key_encrypted: string;
  base_url?: string | null;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

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
