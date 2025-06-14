
-- Add a unique constraint to prevent duplicate portfolio companies for the same user
ALTER TABLE public.portfolio_companies
ADD CONSTRAINT portfolio_companies_company_name_created_by_key UNIQUE (company_name, created_by);

-- Update the function to correctly handle conflicts when creating portfolio companies
CREATE OR REPLACE FUNCTION public.handle_deal_invested()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if pipeline_stage changed to 'Invested'
  IF NEW.pipeline_stage = 'Invested' AND (OLD.pipeline_stage IS NULL OR OLD.pipeline_stage != 'Invested') THEN
    -- Insert into portfolio_companies if not already exists for this user, or update it
    INSERT INTO public.portfolio_companies (
      company_name,
      description,
      relationship_owner,
      created_by
    )
    VALUES (
      NEW.company_name,
      NEW.description,
      NEW.relationship_owner,
      NEW.created_by
    )
    ON CONFLICT (company_name, created_by) DO UPDATE SET
      description = COALESCE(EXCLUDED.description, public.portfolio_companies.description),
      relationship_owner = EXCLUDED.relationship_owner,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$function$;

-- Add INSERT RLS policies to allow users to create new records
DROP POLICY IF EXISTS "Users can insert their own deals" ON public.deals;
CREATE POLICY "Users can insert their own deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert their own portfolio companies" ON public.portfolio_companies;
CREATE POLICY "Users can insert their own portfolio companies" ON public.portfolio_companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can insert their own investors" ON public.investors;
CREATE POLICY "Users can insert their own investors" ON public.investors FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
