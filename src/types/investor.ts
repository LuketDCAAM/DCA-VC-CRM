
import { Database } from '@/integrations/supabase/types';

export type Investor = Database['public']['Tables']['investors']['Row'] & {
  linkedin_url?: string | null;
};
export type InvestmentStage = Database['public']['Enums']['investment_stage'];
