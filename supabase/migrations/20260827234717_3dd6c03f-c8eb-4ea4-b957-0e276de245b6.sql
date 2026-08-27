CREATE TABLE public.portco_funding_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id uuid NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  round_name text NOT NULL,
  round_type text,
  close_date date,
  price_per_share bigint,
  pre_money_valuation bigint,
  post_money_valuation bigint,
  amount_raised bigint,
  lead_investor text,
  we_participated boolean NOT NULL DEFAULT false,
  our_amount bigint,
  our_shares numeric,
  source text,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX portco_funding_rounds_company_idx ON public.portco_funding_rounds (portfolio_company_id, close_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portco_funding_rounds TO authenticated;
GRANT ALL ON public.portco_funding_rounds TO service_role;

ALTER TABLE public.portco_funding_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view funding rounds"
  ON public.portco_funding_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert funding rounds"
  ON public.portco_funding_rounds FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update funding rounds"
  ON public.portco_funding_rounds FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete funding rounds"
  ON public.portco_funding_rounds FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER portco_funding_rounds_set_updated_at
  BEFORE UPDATE ON public.portco_funding_rounds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.portco_quarterly_metrics
  ADD COLUMN mark_date date,
  ADD COLUMN company_valuation bigint,
  ADD COLUMN ownership_pct numeric,
  ADD COLUMN our_fmv bigint,
  ADD COLUMN mark_method text;