
import { Database } from '@/integrations/supabase/types';

export type Investor = Database['public']['Tables']['investors']['Row'];
export type InvestmentStage = Database['public']['Enums']['investment_stage'];
