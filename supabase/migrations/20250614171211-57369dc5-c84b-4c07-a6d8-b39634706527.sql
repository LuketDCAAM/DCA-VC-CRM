
ALTER TABLE public.deals
ADD COLUMN deal_score INTEGER;

ALTER TABLE public.deals
ADD CONSTRAINT deal_score_check CHECK (deal_score >= 0 AND deal_score <= 100);
