CREATE TYPE public.portfolio_vehicle AS ENUM ('Balance Sheet', 'Fund I', 'SPV - DCA Led', 'SPV - Third Party', 'Co-Invest');
CREATE TYPE public.position_status AS ENUM ('Active', 'Exited - Strategic', 'Exited - Financial', 'Exited - IPO', 'Written Off', 'Defunct', 'On Hold');

CREATE TABLE public.portfolio_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id uuid NOT NULL UNIQUE REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  sector text,
  stage text,
  vehicle public.portfolio_vehicle,
  position_status public.position_status NOT NULL DEFAULT 'Active',
  first_investment_date date,
  last_investment_date date,
  current_fmv bigint,
  realized_proceeds bigint NOT NULL DEFAULT 0,
  ownership_pct numeric,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_positions TO authenticated;
GRANT ALL ON public.portfolio_positions TO service_role;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view positions" ON public.portfolio_positions FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can create positions" ON public.portfolio_positions FOR INSERT TO authenticated WITH CHECK (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can update positions" ON public.portfolio_positions FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can delete positions" ON public.portfolio_positions FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE TRIGGER portfolio_positions_set_updated_at BEFORE UPDATE ON public.portfolio_positions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TABLE public.portco_kpi_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id uuid NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  unit text NOT NULL DEFAULT 'number',
  higher_is_better boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (portfolio_company_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portco_kpi_definitions TO authenticated;
GRANT ALL ON public.portco_kpi_definitions TO service_role;
ALTER TABLE public.portco_kpi_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view kpi definitions" ON public.portco_kpi_definitions FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can create kpi definitions" ON public.portco_kpi_definitions FOR INSERT TO authenticated WITH CHECK (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can update kpi definitions" ON public.portco_kpi_definitions FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can delete kpi definitions" ON public.portco_kpi_definitions FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE TRIGGER portco_kpi_definitions_set_updated_at BEFORE UPDATE ON public.portco_kpi_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TABLE public.portco_quarterly_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id uuid NOT NULL REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  fiscal_quarter integer NOT NULL,
  revenue bigint,
  arr bigint,
  gross_margin numeric,
  gross_burn bigint,
  net_burn bigint,
  cash_balance bigint,
  headcount integer,
  nrr numeric,
  grr numeric,
  monthly_churn numeric,
  customer_count integer,
  custom_metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  targets jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed jsonb NOT NULL DEFAULT '{}'::jsonb,
  performance_status text,
  status_override text,
  status_reason text,
  ai_commentary text,
  commentary_updated_at timestamp with time zone,
  notes text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (portfolio_company_id, fiscal_year, fiscal_quarter)
);

CREATE INDEX portco_quarterly_metrics_company_period_idx ON public.portco_quarterly_metrics (portfolio_company_id, fiscal_year DESC, fiscal_quarter DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portco_quarterly_metrics TO authenticated;
GRANT ALL ON public.portco_quarterly_metrics TO service_role;
ALTER TABLE public.portco_quarterly_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved users can view quarterly metrics" ON public.portco_quarterly_metrics FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can create quarterly metrics" ON public.portco_quarterly_metrics FOR INSERT TO authenticated WITH CHECK (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can update quarterly metrics" ON public.portco_quarterly_metrics FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid()));
CREATE POLICY "Approved users can delete quarterly metrics" ON public.portco_quarterly_metrics FOR DELETE TO authenticated USING (public.is_user_approved(auth.uid()));

CREATE TRIGGER portco_quarterly_metrics_set_updated_at BEFORE UPDATE ON public.portco_quarterly_metrics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();