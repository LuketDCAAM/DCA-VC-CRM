-- see staged file
ALTER TABLE public.deals_sector_backup_20261014 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.deals_sector_backup_20261014 FROM anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('call_notes','Users can delete all call notes','DELETE'),
    ('call_notes','Users can view all call notes','SELECT'),
    ('call_notes','Users can update all call notes','UPDATE'),
    ('current_valuations','Users can delete all current valuations','DELETE'),
    ('current_valuations','Users can create current valuations','INSERT'),
    ('current_valuations','Users can view all current valuations','SELECT'),
    ('current_valuations','Users can update all current valuations','UPDATE'),
    ('file_attachments','Users can delete all file attachments','DELETE'),
    ('file_attachments','Users can view all file attachments','SELECT'),
    ('file_attachments','Users can update all file attachments','UPDATE'),
    ('investments','Users can delete all investments','DELETE'),
    ('investments','Users can create investments','INSERT'),
    ('investments','Users can view all investments','SELECT'),
    ('investments','Users can update all investments','UPDATE'),
    ('investor_cadences','Team can delete cadences','DELETE'),
    ('investor_cadences','Team can view cadences','SELECT'),
    ('investor_cadences','Team can update cadences','UPDATE'),
    ('outreach_templates','Team can delete templates','DELETE'),
    ('outreach_templates','Team can insert templates','INSERT'),
    ('outreach_templates','Team can view templates','SELECT'),
    ('outreach_templates','Team can update templates','UPDATE'),
    ('portco_cadences','Team can delete portco cadences','DELETE'),
    ('portco_cadences','Team can view portco cadences','SELECT'),
    ('portco_cadences','Team can update portco cadences','UPDATE'),
    ('portco_funding_rounds','Authenticated users can delete funding rounds','DELETE'),
    ('portco_funding_rounds','Authenticated users can insert funding rounds','INSERT'),
    ('portco_funding_rounds','Authenticated users can view funding rounds','SELECT'),
    ('portco_funding_rounds','Authenticated users can update funding rounds','UPDATE'),
    ('reminders','Users can delete all reminders','DELETE'),
    ('reminders','Users can view all reminders','SELECT'),
    ('reminders','Users can update all reminders','UPDATE')
  ) AS t(tbl, pol, cmd) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    IF r.cmd = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_user_approved(auth.uid()))', r.pol, r.tbl);
    ELSIF r.cmd = 'UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_user_approved(auth.uid())) WITH CHECK (public.is_user_approved(auth.uid()))', r.pol, r.tbl);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated USING (public.is_user_approved(auth.uid()))', r.pol, r.tbl, r.cmd);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Users can create external investors" ON public.external_investors;
DROP POLICY IF EXISTS "Users can view all external investors" ON public.external_investors;
CREATE POLICY "Users can create external investors" ON public.external_investors FOR INSERT TO authenticated WITH CHECK (public.is_user_approved(auth.uid()));
CREATE POLICY "Users can view all external investors" ON public.external_investors FOR SELECT TO authenticated USING (public.is_user_approved(auth.uid()));

DROP POLICY IF EXISTS "Users can view portfolio positions" ON public.portfolio_positions;

DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow authenticated users to upload pitch decks zvbcpp_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload pitch decks zvbcpp_1" ON storage.objects;
DROP POLICY IF EXISTS "llow authenticated users to view pitch decks zvbcpp_0" ON storage.objects;
CREATE POLICY "Approved users can upload pitch decks" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pitch-decks' AND public.is_user_approved(auth.uid()) AND owner_id = (select auth.uid()::text));
CREATE POLICY "Approved users can view pitch decks" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pitch-decks' AND public.is_user_approved(auth.uid()));