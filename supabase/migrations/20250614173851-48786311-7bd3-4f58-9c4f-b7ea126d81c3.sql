
-- Add a column to link contacts to portfolio companies
ALTER TABLE public.contacts
ADD COLUMN portfolio_company_id UUID REFERENCES public.portfolio_companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.contacts.portfolio_company_id IS 'Link to a portfolio company';
