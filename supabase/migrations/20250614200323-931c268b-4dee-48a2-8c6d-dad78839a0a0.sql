
ALTER TABLE public.deals
ADD COLUMN source_date DATE,
ADD COLUMN deal_source TEXT,
ADD COLUMN deal_lead TEXT;
