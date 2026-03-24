
-- Add scored_at column
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS scored_at timestamp with time zone;

-- Backfill existing scored deals with their updated_at
UPDATE public.deals SET scored_at = updated_at WHERE deal_score IS NOT NULL AND scored_at IS NULL;

-- Create trigger to auto-set scored_at when deal_score changes from null to a value
CREATE OR REPLACE FUNCTION public.set_scored_at_timestamp()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  -- Set scored_at when deal_score is first set (was null, now has value)
  IF OLD.deal_score IS NULL AND NEW.deal_score IS NOT NULL AND NEW.scored_at IS NULL THEN
    NEW.scored_at = now();
  END IF;
  -- If score is cleared, optionally clear scored_at
  IF NEW.deal_score IS NULL THEN
    NEW.scored_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER set_scored_at_on_score_change
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_scored_at_timestamp();
