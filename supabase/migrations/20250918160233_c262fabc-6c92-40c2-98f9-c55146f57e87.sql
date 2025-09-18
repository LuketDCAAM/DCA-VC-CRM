-- Relax insert policy to allow approved users to link investors to any deal they can access
DROP POLICY IF EXISTS "Users can link investors to their own deals" ON public.deal_investors;

CREATE POLICY "Approved users can link investors to any deal" 
ON public.deal_investors 
FOR INSERT 
WITH CHECK (
  is_user_approved(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.deals d 
    WHERE d.id = deal_investors.deal_id
  )
);
