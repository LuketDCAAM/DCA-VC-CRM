
-- Add sector column to the deals table
ALTER TABLE public.deals 
ADD COLUMN sector TEXT;

-- Add an index on sector for better query performance
CREATE INDEX idx_deals_sector ON public.deals(sector);
