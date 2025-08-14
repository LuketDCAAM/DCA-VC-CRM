-- Add priority fields to deals table
ALTER TABLE public.deals 
ADD COLUMN is_priority_deal boolean DEFAULT false,
ADD COLUMN priority_rank integer;

-- Create index for priority deals
CREATE INDEX idx_deals_priority ON public.deals (is_priority_deal, priority_rank) WHERE is_priority_deal = true;

-- Create function to enforce max 10 priority deals
CREATE OR REPLACE FUNCTION enforce_max_priority_deals()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to set is_priority_deal to true
  IF NEW.is_priority_deal = true AND (OLD.is_priority_deal IS NULL OR OLD.is_priority_deal = false) THEN
    -- Check if we already have 10 priority deals for this user
    IF (SELECT COUNT(*) FROM deals WHERE is_priority_deal = true AND created_by = NEW.created_by) >= 10 THEN
      RAISE EXCEPTION 'Cannot have more than 10 priority deals. Please remove priority status from another deal first.';
    END IF;
    
    -- Auto-assign next available rank if not provided
    IF NEW.priority_rank IS NULL THEN
      NEW.priority_rank := COALESCE(
        (SELECT MAX(priority_rank) FROM deals WHERE is_priority_deal = true AND created_by = NEW.created_by), 
        0
      ) + 1;
    END IF;
  END IF;

  -- If removing priority status, clear the rank
  IF NEW.is_priority_deal = false THEN
    NEW.priority_rank := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_enforce_max_priority_deals
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_priority_deals();