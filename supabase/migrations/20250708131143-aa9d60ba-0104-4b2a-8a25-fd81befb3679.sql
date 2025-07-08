
-- Add 'viewer' role to the existing app_role enum
ALTER TYPE public.app_role ADD VALUE 'viewer';

-- Update the RLS policies to allow viewers to access dashboard-related data
-- Allow viewers to view deals (read-only)
CREATE POLICY "Viewers can view all deals" ON public.deals
  FOR SELECT TO authenticated 
  USING (
    public.is_user_approved(auth.uid()) AND 
    (public.has_role(auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow viewers to view portfolio companies (read-only)
CREATE POLICY "Viewers can view all portfolio companies" ON public.portfolio_companies
  FOR SELECT TO authenticated 
  USING (
    public.is_user_approved(auth.uid()) AND 
    (public.has_role(auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow viewers to view investors (read-only)
CREATE POLICY "Viewers can view all investors" ON public.investors
  FOR SELECT TO authenticated 
  USING (
    public.is_user_approved(auth.uid()) AND 
    (public.has_role(auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow viewers to view contacts (read-only)
CREATE POLICY "Viewers can view all contacts" ON public.contacts
  FOR SELECT TO authenticated 
  USING (
    public.is_user_approved(auth.uid()) AND 
    (public.has_role(auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow viewers to view investments (read-only)
CREATE POLICY "Viewers can view all investments" ON public.investments
  FOR SELECT TO authenticated 
  USING (
    public.is_user_approved(auth.uid()) AND 
    (public.has_role(auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow viewers to view current valuations (read-only)
CREATE POLICY "Viewers can view all current valuations" ON public.current_valuations
  FOR SELECT TO authenticated 
  USING (
    public.is_user_approved(auth.uid()) AND 
    (public.has_role(auth.uid(), 'viewer') OR public.has_role(auth.uid(), 'user') OR public.has_role(auth.uid(), 'admin'))
  );
