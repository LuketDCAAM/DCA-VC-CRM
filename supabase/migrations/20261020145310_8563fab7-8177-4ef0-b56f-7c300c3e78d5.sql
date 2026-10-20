CREATE TABLE public.portco_cadences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_company_id uuid NOT NULL UNIQUE REFERENCES public.portfolio_companies(id) ON DELETE CASCADE,
  interval_key text NOT NULL DEFAULT 'quarterly',
  anchor_rule text NOT NULL DEFAULT 'day_of_month',
  anchor_day integer NOT NULL DEFAULT 1,
  paused boolean NOT NULL DEFAULT false,
  resume_on date,
  last_contacted_at date,
  next_due_at date,
  owner_id uuid,
  contact_name text,
  contact_email text,
  created_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portco_cadences TO authenticated;
GRANT ALL ON public.portco_cadences TO service_role;
ALTER TABLE public.portco_cadences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view portco cadences" ON public.portco_cadences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert portco cadences" ON public.portco_cadences FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Team can update portco cadences" ON public.portco_cadences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Team can delete portco cadences" ON public.portco_cadences FOR DELETE TO authenticated USING (true);
CREATE TRIGGER portco_cadences_set_updated_at BEFORE UPDATE ON public.portco_cadences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

ALTER TABLE public.outreach_follow_ups ADD COLUMN portfolio_company_id uuid REFERENCES public.portfolio_companies(id) ON DELETE CASCADE;

INSERT INTO public.outreach_templates (purpose, label, description, tone, instructions, sort_order)
SELECT 'portco_check_in', 'Portfolio check-in', 'Regular check-in with a portfolio company on key metrics and how we can help', 'warm, supportive, concise',
'Open with a genuine, brief note. Reference the latest numbers we have and ask for an update on any that are missing or stale (ARR, burn, cash runway, headcount). If areas of concern are listed, offer one or two concrete ways we can help (intros, fundraising prep, hiring, customer intros) without sounding alarmed. End with an easy ask: a short reply or a 20-minute call.', 90
WHERE NOT EXISTS (SELECT 1 FROM public.outreach_templates WHERE purpose = 'portco_check_in');