-- Follow-ups
CREATE TABLE public.outreach_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  investor_id uuid REFERENCES public.investors(id) ON DELETE CASCADE,
  contact_email text,
  contact_name text,
  purpose text NOT NULL DEFAULT 'check_in',
  due_date date NOT NULL,
  owner_id uuid NOT NULL,
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  snooze_until date,
  context text,
  subject text,
  body text,
  regenerate_note text,
  drafted_at timestamptz,
  sent_at timestamptz,
  outlook_draft_id text,
  outlook_web_link text,
  sync_status text NOT NULL DEFAULT 'pending',
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_outreach_follow_ups_owner_due ON public.outreach_follow_ups(owner_id, due_date);
CREATE INDEX idx_outreach_follow_ups_deal ON public.outreach_follow_ups(deal_id);
CREATE INDEX idx_outreach_follow_ups_investor ON public.outreach_follow_ups(investor_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_follow_ups TO authenticated;
GRANT ALL ON public.outreach_follow_ups TO service_role;
ALTER TABLE public.outreach_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own or assigned follow-ups"
  ON public.outreach_follow_ups FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Users create follow-ups"
  ON public.outreach_follow_ups FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users update their own or assigned follow-ups"
  ON public.outreach_follow_ups FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Users delete their own follow-ups"
  ON public.outreach_follow_ups FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid());

CREATE TRIGGER outreach_follow_ups_set_updated_at
  BEFORE UPDATE ON public.outreach_follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Templates
CREATE TABLE public.outreach_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  tone text NOT NULL DEFAULT 'warm, concise, professional',
  instructions text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_templates TO authenticated;
GRANT ALL ON public.outreach_templates TO service_role;
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view templates"
  ON public.outreach_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert templates"
  ON public.outreach_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update templates"
  ON public.outreach_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Team can delete templates"
  ON public.outreach_templates FOR DELETE TO authenticated USING (true);

CREATE TRIGGER outreach_templates_set_updated_at
  BEFORE UPDATE ON public.outreach_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Monthly investor digest batches
CREATE TABLE public.outreach_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month date NOT NULL,
  title text NOT NULL,
  intro_note text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_batches TO authenticated;
GRANT ALL ON public.outreach_batches TO service_role;
ALTER TABLE public.outreach_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own batches"
  ON public.outreach_batches FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE TRIGGER outreach_batches_set_updated_at
  BEFORE UPDATE ON public.outreach_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TABLE public.outreach_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.outreach_batches(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  created_by uuid NOT NULL,
  deal_ids uuid[] NOT NULL DEFAULT '{}',
  match_rationale jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed',
  subject text,
  body text,
  regenerate_note text,
  drafted_at timestamptz,
  sent_at timestamptz,
  outlook_draft_id text,
  outlook_web_link text,
  sync_status text NOT NULL DEFAULT 'pending',
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, investor_id)
);

CREATE INDEX idx_outreach_batch_items_batch ON public.outreach_batch_items(batch_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_batch_items TO authenticated;
GRANT ALL ON public.outreach_batch_items TO service_role;
ALTER TABLE public.outreach_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own or assigned batch items"
  ON public.outreach_batch_items FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Users create batch items"
  ON public.outreach_batch_items FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users update their own or assigned batch items"
  ON public.outreach_batch_items FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "Users delete their own batch items"
  ON public.outreach_batch_items FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR owner_id = auth.uid());

CREATE TRIGGER outreach_batch_items_set_updated_at
  BEFORE UPDATE ON public.outreach_batch_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Investor cadence
CREATE TABLE public.investor_cadences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL UNIQUE REFERENCES public.investors(id) ON DELETE CASCADE,
  interval_key text NOT NULL DEFAULT 'quarterly',
  anchor_rule text NOT NULL DEFAULT 'day_of_month',
  anchor_day integer NOT NULL DEFAULT 1,
  paused boolean NOT NULL DEFAULT false,
  resume_on date,
  last_contacted_at date,
  next_due_at date,
  owner_id uuid,
  created_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_cadences TO authenticated;
GRANT ALL ON public.investor_cadences TO service_role;
ALTER TABLE public.investor_cadences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view cadences"
  ON public.investor_cadences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert cadences"
  ON public.investor_cadences FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Team can update cadences"
  ON public.investor_cadences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Team can delete cadences"
  ON public.investor_cadences FOR DELETE TO authenticated USING (true);

CREATE TRIGGER investor_cadences_set_updated_at
  BEFORE UPDATE ON public.investor_cadences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();