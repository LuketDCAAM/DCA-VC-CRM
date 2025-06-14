
-- Stricter RLS policies for deals
DROP POLICY IF EXISTS "Users can view all deals" ON public.deals;
CREATE POLICY "Users can view their own deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update all deals" ON public.deals;
CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete all deals" ON public.deals;
CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Stricter RLS policies for portfolio_companies
DROP POLICY IF EXISTS "Users can view all portfolio companies" ON public.portfolio_companies;
CREATE POLICY "Users can view their own portfolio companies" ON public.portfolio_companies FOR SELECT TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update all portfolio companies" ON public.portfolio_companies;
CREATE POLICY "Users can update their own portfolio companies" ON public.portfolio_companies FOR UPDATE TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete all portfolio companies" ON public.portfolio_companies;
CREATE POLICY "Users can delete their own portfolio companies" ON public.portfolio_companies FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Stricter RLS policies for investors
DROP POLICY IF EXISTS "Users can view all investors" ON public.investors;
CREATE POLICY "Users can view their own investors" ON public.investors FOR SELECT TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update all investors" ON public.investors;
CREATE POLICY "Users can update their own investors" ON public.investors FOR UPDATE TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete all investors" ON public.investors;
CREATE POLICY "Users can delete their own investors" ON public.investors FOR DELETE TO authenticated USING (auth.uid() = created_by);
