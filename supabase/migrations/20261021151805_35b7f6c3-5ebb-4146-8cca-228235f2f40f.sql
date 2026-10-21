-- Instrument type enum for portfolio positions
CREATE TYPE public.instrument_type AS ENUM ('SAFE Note', 'Convertible Note', 'Preferred Equity', 'Common Equity');

ALTER TABLE public.portfolio_positions
  ADD COLUMN instrument_type public.instrument_type;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_positions TO authenticated;
GRANT ALL ON public.portfolio_positions TO service_role;

ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_positions'
      AND policyname = 'Users can view portfolio positions'
  ) THEN
    CREATE POLICY "Users can view portfolio positions"
      ON public.portfolio_positions FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_positions'
      AND policyname = 'Users can create portfolio positions'
  ) THEN
    CREATE POLICY "Users can create portfolio positions"
      ON public.portfolio_positions FOR INSERT
      TO authenticated
      WITH CHECK (
        created_by = auth.uid()
        OR public.is_user_approved(auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_positions'
      AND policyname = 'Users can update portfolio positions'
  ) THEN
    CREATE POLICY "Users can update portfolio positions"
      ON public.portfolio_positions FOR UPDATE
      TO authenticated
      USING (
        created_by = auth.uid()
        OR public.is_user_approved(auth.uid())
      )
      WITH CHECK (
        created_by = auth.uid()
        OR public.is_user_approved(auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portfolio_positions'
      AND policyname = 'Users can delete portfolio positions'
  ) THEN
    CREATE POLICY "Users can delete portfolio positions"
      ON public.portfolio_positions FOR DELETE
      TO authenticated
      USING (created_by = auth.uid());
  END IF;
END $$;