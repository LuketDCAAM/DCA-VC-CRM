
-- Create API configurations table
CREATE TABLE public.api_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  base_url TEXT,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider, created_by)
);

-- Create API sync logs table
CREATE TABLE public.api_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID,
  api_provider TEXT NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  data_fetched JSONB,
  error_message TEXT,
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE
);

-- Create company funding rounds table
CREATE TABLE public.company_funding_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
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
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE,
  UNIQUE(deal_id, external_source, external_id)
);

-- Create external investors table
CREATE TABLE public.external_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  firm_name TEXT,
  external_source TEXT NOT NULL,
  external_id TEXT,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_source, external_id)
);

-- Add external data columns to deals table
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
ADD COLUMN external_data_sync_status TEXT;

-- Enable RLS on new tables
ALTER TABLE public.api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_investors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_configurations
CREATE POLICY "Users can manage their own API configurations" 
  ON public.api_configurations 
  FOR ALL 
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for api_sync_logs
CREATE POLICY "Users can view their own sync logs" 
  ON public.api_sync_logs 
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create sync logs" 
  ON public.api_sync_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own sync logs" 
  ON public.api_sync_logs 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Create RLS policies for company_funding_rounds
CREATE POLICY "Users can view funding rounds for their deals" 
  ON public.company_funding_rounds 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id = company_funding_rounds.deal_id 
    AND deals.created_by = auth.uid()
  ));

CREATE POLICY "Users can create funding rounds for their deals" 
  ON public.company_funding_rounds 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deals 
    WHERE deals.id = company_funding_rounds.deal_id 
    AND deals.created_by = auth.uid()
  ));

-- Create RLS policies for external_investors
CREATE POLICY "Users can view all external investors" 
  ON public.external_investors 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create external investors" 
  ON public.external_investors 
  FOR INSERT 
  WITH CHECK (true);
