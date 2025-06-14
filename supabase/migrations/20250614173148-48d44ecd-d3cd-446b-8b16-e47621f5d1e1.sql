
CREATE TABLE public.deal_investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT deal_investor_unique UNIQUE (deal_id, investor_id)
);

COMMENT ON TABLE public.deal_investors IS 'Join table to link investors to deals in a many-to-many relationship.';

ALTER TABLE public.deal_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links for their own deals"
ON public.deal_investors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deals WHERE id = deal_investors.deal_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can link investors to their own deals"
ON public.deal_investors
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deals WHERE id = deal_investors.deal_id AND created_by = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.investors WHERE id = deal_investors.investor_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can unlink investors from their own deals"
ON public.deal_investors
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.deals WHERE id = deal_investors.deal_id AND created_by = auth.uid()
  )
);
