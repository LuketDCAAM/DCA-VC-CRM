-- Update RLS policy for deal_investors to allow linking any investor to user's own deals
DROP POLICY IF EXISTS "Users can link investors to their own deals" ON deal_investors;

CREATE POLICY "Users can link investors to their own deals" 
ON deal_investors 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM deals 
    WHERE deals.id = deal_investors.deal_id 
    AND deals.created_by = auth.uid()
  )
);