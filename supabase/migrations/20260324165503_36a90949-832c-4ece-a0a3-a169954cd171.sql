CREATE OR REPLACE FUNCTION public.set_scored_at_timestamp()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.deal_score IS NOT NULL AND (OLD.deal_score IS NULL OR OLD.deal_score IS DISTINCT FROM NEW.deal_score) THEN
    IF NEW.scored_at IS NOT DISTINCT FROM OLD.scored_at THEN
      NEW.scored_at = now();
    END IF;
  END IF;
  IF NEW.deal_score IS NULL THEN
    NEW.scored_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;