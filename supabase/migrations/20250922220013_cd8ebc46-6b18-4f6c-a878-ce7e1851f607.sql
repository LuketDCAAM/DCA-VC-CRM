-- Fix security issue: Add missing policy for user_approval_logs
CREATE POLICY "Admins can create approval logs"
ON public.user_approval_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));