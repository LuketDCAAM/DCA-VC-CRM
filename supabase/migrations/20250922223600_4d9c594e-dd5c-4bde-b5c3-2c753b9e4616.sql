-- Add missing INSERT policy for user_approvals table
-- This allows admins to create new approval records when needed
CREATE POLICY "Admins can insert approvals" 
ON user_approvals 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));