
-- Extend deals table with external data columns
ALTER TABLE public.deals 
ADD COLUMN linkedin_url TEXT,
ADD COLUMN crunchbase_url TEXT,
ADD COLUMN total_funding_raised BIGINT,
ADD COLUMN last_funding_date DATE,
ADD COLUMN employee_count_range TEXT,
ADD COLUMN founded_year INTEGER,
ADD COLUMN headquarters_location TEXT,
ADD COLUMN company_type TEXT,
ADD COLUMN external_data_last_synced TIMESTAMP WITH TIME ZONE,
ADD COLUMN external_data_sync_status TEXT DEFAULT 'pending';

-- Create company_funding_rounds table
CREATE TABLE public.company_funding_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL,
  amount_raised BIGINT,
  funding_date DATE,
  lead_investors TEXT[],
  participating_investors TEXT[],
  valuation_pre_money BIGINT,
  valuation_post_money BIGINT,
  external_source TEXT NOT NULL,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create external_investors table
CREATE TABLE public.external_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- VC, Angel, Corporate, etc.
  linkedin_url TEXT,
  website TEXT,
  location TEXT,
  investment_stage_focus TEXT[],
  sector_focus TEXT[],
  external_source TEXT NOT NULL,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, external_source)
);

-- Create api_sync_logs table
CREATE TABLE public.api_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  api_provider TEXT NOT NULL,
  sync_type TEXT NOT NULL, -- 'manual', 'auto', 'bulk'
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'partial'
  data_fetched JSONB,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL
);

-- Create api_configurations table for storing API keys and settings
CREATE TABLE public.api_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT,
  base_url TEXT,
  rate_limit_per_minute INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider, created_by)
);

-- Add RLS policies for new tables
ALTER TABLE public.company_funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_funding_rounds
CREATE POLICY "Approved users can view all funding rounds" 
  ON public.company_funding_rounds 
  FOR SELECT 
  USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create funding rounds" 
  ON public.company_funding_rounds 
  FOR INSERT 
  WITH CHECK (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update funding rounds" 
  ON public.company_funding_rounds 
  FOR UPDATE 
  USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete funding rounds" 
  ON public.company_funding_rounds 
  FOR DELETE 
  USING (is_user_approved(auth.uid()));

-- RLS policies for external_investors
CREATE POLICY "Approved users can view all external investors" 
  ON public.external_investors 
  FOR SELECT 
  USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create external investors" 
  ON public.external_investors 
  FOR INSERT 
  WITH CHECK (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update external investors" 
  ON public.external_investors 
  FOR UPDATE 
  USING (is_user_approved(auth.uid()));

-- RLS policies for api_sync_logs
CREATE POLICY "Users can view their own sync logs" 
  ON public.api_sync_logs 
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own sync logs" 
  ON public.api_sync_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Approved users can view all sync logs" 
  ON public.api_sync_logs 
  FOR SELECT 
  USING (is_user_approved(auth.uid()));

-- RLS policies for api_configurations
CREATE POLICY "Users can manage their own API configurations" 
  ON public.api_configurations 
  FOR ALL 
  USING (auth.uid() = created_by);

-- Create indexes for performance
CREATE INDEX idx_deals_external_sync ON public.deals(external_data_sync_status, external_data_last_synced);
CREATE INDEX idx_funding_rounds_deal_id ON public.company_funding_rounds(deal_id);
CREATE INDEX idx_sync_logs_deal_id ON public.api_sync_logs(deal_id);
CREATE INDEX idx_sync_logs_status ON public.api_sync_logs(status, created_at);
CREATE INDEX idx_external_investors_source ON public.external_investors(external_source, external_id);
