-- 1. Investment thesis (single workspace row)
CREATE TABLE public.investment_thesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sectors text[] DEFAULT '{}',
  stages text[] DEFAULT '{}',
  check_size_min bigint,
  check_size_max bigint,
  geographies text[] DEFAULT '{}',
  business_models text[] DEFAULT '{}',
  must_haves text[] DEFAULT '{}',
  deal_breakers text[] DEFAULT '{}',
  weight_sector_fit integer NOT NULL DEFAULT 25,
  weight_stage_fit integer NOT NULL DEFAULT 15,
  weight_traction integer NOT NULL DEFAULT 25,
  weight_team integer NOT NULL DEFAULT 20,
  weight_market integer NOT NULL DEFAULT 15,
  narrative text,
  notion_transcripts_db_id text,
  auto_run_on_create boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_thesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view thesis"
  ON public.investment_thesis FOR SELECT
  TO authenticated
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Admins can insert thesis"
  ON public.investment_thesis FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update thesis"
  ON public.investment_thesis FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_investment_thesis_updated_at
  BEFORE UPDATE ON public.investment_thesis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Seed a single empty row so the UI always has something to edit
INSERT INTO public.investment_thesis (narrative)
VALUES ('Describe your fund thesis here. The Analyst agent will use this to score new deals.');

-- 2. Analyst runs (history)
CREATE TABLE public.analyst_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  trigger text NOT NULL DEFAULT 'manual', -- 'manual' | 'auto'
  status text NOT NULL DEFAULT 'running', -- 'running' | 'completed' | 'failed'
  score integer,
  rubric jsonb,
  summary text,
  key_findings text[],
  sources jsonb DEFAULT '[]'::jsonb,
  proposed_actions jsonb DEFAULT '[]'::jsonb,
  error text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_analyst_runs_deal ON public.analyst_runs(deal_id, created_at DESC);

ALTER TABLE public.analyst_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can view all runs"
  ON public.analyst_runs FOR SELECT
  TO authenticated
  USING (public.is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create runs"
  ON public.analyst_runs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_user_approved(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Service role can update runs"
  ON public.analyst_runs FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);