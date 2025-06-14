
-- Add description column to deals table
ALTER TABLE public.deals ADD COLUMN description TEXT;

-- Add description column to portfolio_companies table
ALTER TABLE public.portfolio_companies ADD COLUMN description TEXT;

-- Add a unique constraint on company_name in portfolio_companies to avoid duplicates.
-- This might fail if you have existing portfolio companies with the same name.
ALTER TABLE public.portfolio_companies ADD CONSTRAINT portfolio_companies_company_name_key UNIQUE (company_name);

-- Update function to also copy description when a deal becomes invested
CREATE OR REPLACE FUNCTION handle_deal_invested()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if pipeline_stage changed to 'Invested'
  IF NEW.pipeline_stage = 'Invested' AND (OLD.pipeline_stage IS NULL OR OLD.pipeline_stage != 'Invested') THEN
    -- Insert into portfolio_companies if not already exists, or update it
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
    ON CONFLICT (company_name) DO UPDATE SET
      description = COALESCE(EXCLUDED.description, public.portfolio_companies.description),
      relationship_owner = EXCLUDED.relationship_owner,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
