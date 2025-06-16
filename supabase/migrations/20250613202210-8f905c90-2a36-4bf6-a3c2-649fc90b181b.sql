
-- Create enum types for pipeline stages and round stages
CREATE TYPE pipeline_stage AS ENUM ('Inactive','Initial Contact', 'First Meeting', 'Due Diligence', 'Term Sheet', 'Legal Review', 'Invested', 'Passed');
CREATE TYPE round_stage AS ENUM ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Growth');
CREATE TYPE investment_stage AS ENUM ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage');
CREATE TYPE company_status AS ENUM ('Active', 'Exited', 'Dissolved');

-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  pipeline_stage pipeline_stage NOT NULL DEFAULT 'Initial Contact',
  round_stage round_stage,
  round_size BIGINT, -- in cents to avoid floating point issues
  post_money_valuation BIGINT, -- in cents
  revenue BIGINT, -- in cents
  location TEXT,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  last_call_date DATE,
  tags TEXT[],
  relationship_owner UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investors table
CREATE TABLE public.investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  firm_name TEXT,
  firm_website TEXT,
  location TEXT,
  preferred_investment_stage investment_stage,
  average_check_size BIGINT, -- in cents
  preferred_sectors TEXT[],
  tags TEXT[],
  relationship_owner UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio companies table
CREATE TABLE public.portfolio_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  status company_status NOT NULL DEFAULT 'Active',
  tags TEXT[],
  relationship_owner UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investments table to track multiple investments per company
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE CASCADE NOT NULL,
  investment_date DATE NOT NULL,
  amount_invested BIGINT NOT NULL, -- in cents
  post_money_valuation BIGINT, -- in cents at time of investment
  price_per_share BIGINT, -- in cents
  revenue_at_investment BIGINT, -- in cents
  ownership_percentage DECIMAL(5,4), -- e.g., 0.1234 for 12.34%
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create current valuations table for latest round data
CREATE TABLE public.current_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
  last_round_post_money_valuation BIGINT, -- in cents
  last_round_price_per_share BIGINT, -- in cents
  current_ownership_percentage DECIMAL(5,4),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table (unified contact directory)
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  company_or_firm TEXT,
  email TEXT,
  phone TEXT,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL,
  relationship_owner UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call notes table for interactions
CREATE TABLE public.call_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
  portfolio_company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  call_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT call_notes_reference_check CHECK (
    (deal_id IS NOT NULL AND investor_id IS NULL AND portfolio_company_id IS NULL) OR
    (deal_id IS NULL AND investor_id IS NOT NULL AND portfolio_company_id IS NULL) OR
    (deal_id IS NULL AND investor_id IS NULL AND portfolio_company_id IS NOT NULL)
  )
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
  portfolio_company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT reminders_reference_check CHECK (
    (deal_id IS NOT NULL AND investor_id IS NULL AND portfolio_company_id IS NULL) OR
    (deal_id IS NULL AND investor_id IS NOT NULL AND portfolio_company_id IS NULL) OR
    (deal_id IS NULL AND investor_id IS NULL AND portfolio_company_id IS NOT NULL)
  )
);

-- Create file attachments table
CREATE TABLE public.file_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE,
  portfolio_company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT attachments_reference_check CHECK (
    (deal_id IS NOT NULL AND investor_id IS NULL AND portfolio_company_id IS NULL) OR
    (deal_id IS NULL AND investor_id IS NOT NULL AND portfolio_company_id IS NULL) OR
    (deal_id IS NULL AND investor_id IS NULL AND portfolio_company_id IS NOT NULL)
  )
);

-- Enable Row Level Security on all tables
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deals
CREATE POLICY "Users can view all deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all deals" ON public.deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all deals" ON public.deals FOR DELETE TO authenticated USING (true);

-- Create RLS policies for investors
CREATE POLICY "Users can view all investors" ON public.investors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create investors" ON public.investors FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all investors" ON public.investors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all investors" ON public.investors FOR DELETE TO authenticated USING (true);

-- Create RLS policies for portfolio companies
CREATE POLICY "Users can view all portfolio companies" ON public.portfolio_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create portfolio companies" ON public.portfolio_companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all portfolio companies" ON public.portfolio_companies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all portfolio companies" ON public.portfolio_companies FOR DELETE TO authenticated USING (true);

-- Create RLS policies for investments
CREATE POLICY "Users can view all investments" ON public.investments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update all investments" ON public.investments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all investments" ON public.investments FOR DELETE TO authenticated USING (true);

-- Create RLS policies for current valuations
CREATE POLICY "Users can view all current valuations" ON public.current_valuations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create current valuations" ON public.current_valuations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update all current valuations" ON public.current_valuations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all current valuations" ON public.current_valuations FOR DELETE TO authenticated USING (true);

-- Create RLS policies for contacts
CREATE POLICY "Users can view all contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all contacts" ON public.contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all contacts" ON public.contacts FOR DELETE TO authenticated USING (true);

-- Create RLS policies for call notes
CREATE POLICY "Users can view all call notes" ON public.call_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create call notes" ON public.call_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all call notes" ON public.call_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all call notes" ON public.call_notes FOR DELETE TO authenticated USING (true);

-- Create RLS policies for reminders
CREATE POLICY "Users can view all reminders" ON public.reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reminders" ON public.reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all reminders" ON public.reminders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all reminders" ON public.reminders FOR DELETE TO authenticated USING (true);

-- Create RLS policies for file attachments
CREATE POLICY "Users can view all file attachments" ON public.file_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create file attachments" ON public.file_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update all file attachments" ON public.file_attachments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete all file attachments" ON public.file_attachments FOR DELETE TO authenticated USING (true);

-- Create function to automatically move deals to portfolio when marked as "Invested"
CREATE OR REPLACE FUNCTION handle_deal_invested()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if pipeline_stage changed to 'Invested'
  IF NEW.pipeline_stage = 'Invested' AND (OLD.pipeline_stage IS NULL OR OLD.pipeline_stage != 'Invested') THEN
    -- Insert into portfolio_companies if not already exists
    INSERT INTO public.portfolio_companies (
      company_name,
      relationship_owner,
      created_by
    )
    VALUES (
      NEW.company_name,
      NEW.relationship_owner,
      NEW.created_by
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-moving deals to portfolio
CREATE TRIGGER on_deal_invested
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION handle_deal_invested();

-- Create indexes for better performance
CREATE INDEX idx_deals_pipeline_stage ON public.deals(pipeline_stage);
CREATE INDEX idx_deals_created_by ON public.deals(created_by);
CREATE INDEX idx_deals_company_name ON public.deals(company_name);
CREATE INDEX idx_investors_created_by ON public.investors(created_by);
CREATE INDEX idx_portfolio_companies_created_by ON public.portfolio_companies(created_by);
CREATE INDEX idx_contacts_deal_id ON public.contacts(deal_id);
CREATE INDEX idx_contacts_investor_id ON public.contacts(investor_id);
CREATE INDEX idx_call_notes_deal_id ON public.call_notes(deal_id);
CREATE INDEX idx_call_notes_investor_id ON public.call_notes(investor_id);
CREATE INDEX idx_reminders_reminder_date ON public.reminders(reminder_date);
