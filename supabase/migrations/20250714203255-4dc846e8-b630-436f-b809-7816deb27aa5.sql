
-- Add linkedin_url column to deals table
ALTER TABLE public.deals ADD COLUMN linkedin_url TEXT;

-- Add linkedin_url column to investors table  
ALTER TABLE public.investors ADD COLUMN linkedin_url TEXT;

-- Add linkedin_url column to lp_engagements table
ALTER TABLE public.lp_engagements ADD COLUMN linkedin_url TEXT;
