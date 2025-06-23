
-- First, let's check what RLS policies currently exist on the deals table
-- and update them to allow approved users to see all deals

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Approved users can view all deals" ON public.deals;
DROP POLICY IF EXISTS "Approved users can create deals" ON public.deals;
DROP POLICY IF EXISTS "Approved users can update deals" ON public.deals;
DROP POLICY IF EXISTS "Approved users can delete deals" ON public.deals;

-- Create new policies that allow approved users to see ALL deals, not just their own
CREATE POLICY "Approved users can view all deals" ON public.deals
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create deals" ON public.deals
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update all deals" ON public.deals
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete all deals" ON public.deals
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Let's also update the other tables to have consistent policies
-- Portfolio companies
DROP POLICY IF EXISTS "Approved users can view all portfolio companies" ON public.portfolio_companies;
DROP POLICY IF EXISTS "Approved users can create portfolio companies" ON public.portfolio_companies;
DROP POLICY IF EXISTS "Approved users can update portfolio companies" ON public.portfolio_companies;
DROP POLICY IF EXISTS "Approved users can delete portfolio companies" ON public.portfolio_companies;

CREATE POLICY "Approved users can view all portfolio companies" ON public.portfolio_companies
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create portfolio companies" ON public.portfolio_companies
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update all portfolio companies" ON public.portfolio_companies
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete all portfolio companies" ON public.portfolio_companies
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Investors
DROP POLICY IF EXISTS "Approved users can view all investors" ON public.investors;
DROP POLICY IF EXISTS "Approved users can create investors" ON public.investors;
DROP POLICY IF EXISTS "Approved users can update investors" ON public.investors;
DROP POLICY IF EXISTS "Approved users can delete investors" ON public.investors;

CREATE POLICY "Approved users can view all investors" ON public.investors
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create investors" ON public.investors
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update all investors" ON public.investors
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete all investors" ON public.investors
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

-- Contacts
DROP POLICY IF EXISTS "Approved users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Approved users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Approved users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Approved users can delete contacts" ON public.contacts;

CREATE POLICY "Approved users can view all contacts" ON public.contacts
  FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK (
    public.is_user_approved(auth.uid()) AND auth.uid() = created_by
  );

CREATE POLICY "Approved users can update all contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete all contacts" ON public.contacts
  FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));
