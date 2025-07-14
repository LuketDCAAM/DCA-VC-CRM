
-- Create LP engagements table
CREATE TABLE public.lp_engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lp_name TEXT NOT NULL,
  lp_type TEXT, -- Individual, Family Office, Institution, Fund of Funds, etc.
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  linkedin_url TEXT,
  relationship_owner UUID,
  commitment_amount BIGINT,
  committed_date DATE,
  capital_called BIGINT DEFAULT 0,
  capital_returned BIGINT DEFAULT 0,
  engagement_stage TEXT DEFAULT 'Prospect', -- Prospect, Engaged, Committed, Active, Inactive
  location TEXT,
  investment_focus TEXT[], -- Array of focus areas
  ticket_size_min BIGINT,
  ticket_size_max BIGINT,
  last_interaction_date DATE,
  next_steps TEXT,
  notes TEXT,
  tags TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for LP engagements
ALTER TABLE public.lp_engagements ENABLE ROW LEVEL SECURITY;

-- Policy for approved users to view all LP engagements
CREATE POLICY "Approved users can view all lp engagements" 
  ON public.lp_engagements 
  FOR SELECT 
  USING (is_user_approved(auth.uid()));

-- Policy for approved users to create LP engagements
CREATE POLICY "Approved users can create lp engagements" 
  ON public.lp_engagements 
  FOR INSERT 
  WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

-- Policy for approved users to update all LP engagements
CREATE POLICY "Approved users can update all lp engagements" 
  ON public.lp_engagements 
  FOR UPDATE 
  USING (is_user_approved(auth.uid()));

-- Policy for approved users to delete all LP engagements
CREATE POLICY "Approved users can delete all lp engagements" 
  ON public.lp_engagements 
  FOR DELETE 
  USING (is_user_approved(auth.uid()));

-- Policy for users to manage their own LP engagements
CREATE POLICY "Users can view their own lp engagements" 
  ON public.lp_engagements 
  FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own lp engagements" 
  ON public.lp_engagements 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own lp engagements" 
  ON public.lp_engagements 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own lp engagements" 
  ON public.lp_engagements 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Create engagement stages enum for consistency
CREATE TYPE engagement_stage AS ENUM (
  'Prospect',
  'Initial Contact', 
  'Due Diligence',
  'Negotiation',
  'Committed',
  'Active',
  'Inactive',
  'Declined'
);

-- Update the engagement_stage column to use the enum
ALTER TABLE public.lp_engagements 
ALTER COLUMN engagement_stage TYPE engagement_stage 
USING engagement_stage::engagement_stage;

-- Set default value
ALTER TABLE public.lp_engagements 
ALTER COLUMN engagement_stage SET DEFAULT 'Prospect'::engagement_stage;
