
-- ============ deal_scorecards ============
CREATE TABLE public.deal_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  is_current BOOLEAN NOT NULL DEFAULT true,

  -- Company info
  sector TEXT,
  stage TEXT,
  geography TEXT,
  geography_tier TEXT,
  founding_year INTEGER,
  deal_lead TEXT,
  vehicle TEXT,
  repeat_founder BOOLEAN,
  has_technical_cofounder BOOLEAN,

  -- Round & capital structure
  fundraise_amount NUMERIC,
  valuation NUMERIC,
  prev_valuation NUMERIC,
  committed_amount NUMERIC,
  round_deadline DATE,
  founder_ownership_pct NUMERIC,
  bridge_rounds_18mo INTEGER,
  total_debt_excl_convertibles NUMERIC,

  -- Financial & operating
  current_arr NUMERIC,
  prior_arr NUMERIC,
  forecast_arr NUMERIC,
  gross_burn NUMERIC,
  net_burn NUMERIC,
  cash_balance NUMERIC,
  total_raised NUMERIC,
  gross_margin NUMERIC,
  fcst_gross_margin NUMERIC,
  acv NUMERIC,
  employee_count INTEGER,
  nrr NUMERIC,
  grr NUMERIC,
  top_cust_pct NUMERIC,
  monthly_churn NUMERIC,

  -- Narrative (markdown)
  company_overview TEXT,
  investment_thesis TEXT,
  traction_milestones TEXT,
  business_model TEXT,
  key_strengths TEXT,
  key_risks TEXT,
  investor_base TEXT,
  competitive_landscape TEXT,
  use_of_funds TEXT,
  dca_value_add TEXT,

  -- Qualitative ratings: {market,product,business_model,team,exit}
  -- each {score:1-5, rationale, source}
  qualitative_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Per-metric DCA notes
  metric_notes JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Computed snapshot from engine (tiers, totals, blended, hard stops, risk flags, autocalcs)
  computed JSONB NOT NULL DEFAULT '{}'::jsonb,
  blended_score NUMERIC,
  classification TEXT,

  ai_run_id UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX deal_scorecards_deal_id_idx ON public.deal_scorecards (deal_id);
CREATE INDEX deal_scorecards_deal_current_idx ON public.deal_scorecards (deal_id) WHERE is_current = true;
CREATE UNIQUE INDEX deal_scorecards_deal_version_idx ON public.deal_scorecards (deal_id, version);

ALTER TABLE public.deal_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view scorecards"
ON public.deal_scorecards FOR SELECT TO authenticated
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create scorecards"
ON public.deal_scorecards FOR INSERT TO authenticated
WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update scorecards"
ON public.deal_scorecards FOR UPDATE TO authenticated
USING (is_user_approved(auth.uid()));

CREATE POLICY "Creators can delete scorecards"
ON public.deal_scorecards FOR DELETE TO authenticated
USING (auth.uid() = created_by);

CREATE TRIGGER deal_scorecards_set_updated_at
BEFORE UPDATE ON public.deal_scorecards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============ scorecard_benchmarks ============
CREATE TABLE public.scorecard_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  stage TEXT NOT NULL,
  metric TEXT NOT NULL,
  target_value NUMERIC,
  tier_thresholds JSONB NOT NULL DEFAULT '{}'::jsonb,
  weight NUMERIC NOT NULL DEFAULT 0,
  inverted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sector, stage, metric)
);

CREATE INDEX scorecard_benchmarks_sector_stage_idx
  ON public.scorecard_benchmarks (sector, stage);

ALTER TABLE public.scorecard_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view benchmarks"
ON public.scorecard_benchmarks FOR SELECT TO authenticated
USING (is_user_approved(auth.uid()));

CREATE POLICY "Admins can insert benchmarks"
ON public.scorecard_benchmarks FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update benchmarks"
ON public.scorecard_benchmarks FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete benchmarks"
ON public.scorecard_benchmarks FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER scorecard_benchmarks_set_updated_at
BEFORE UPDATE ON public.scorecard_benchmarks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============ scorecard_documents ============
CREATE TABLE public.scorecard_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID NOT NULL REFERENCES public.deal_scorecards(id) ON DELETE CASCADE,
  file_attachment_id UUID,
  external_url TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('deck','transcript','financials','link')),
  parsed_excerpt TEXT,
  parsed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX scorecard_documents_scorecard_idx
  ON public.scorecard_documents (scorecard_id);

ALTER TABLE public.scorecard_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view scorecard documents"
ON public.scorecard_documents FOR SELECT TO authenticated
USING (is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create scorecard documents"
ON public.scorecard_documents FOR INSERT TO authenticated
WITH CHECK (is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Approved users can update scorecard documents"
ON public.scorecard_documents FOR UPDATE TO authenticated
USING (is_user_approved(auth.uid()));

CREATE POLICY "Creators can delete scorecard documents"
ON public.scorecard_documents FOR DELETE TO authenticated
USING (auth.uid() = created_by);
