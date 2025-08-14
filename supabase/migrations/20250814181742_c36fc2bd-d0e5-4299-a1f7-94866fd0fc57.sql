-- Add total_calls field to deals table to track number of calls
ALTER TABLE public.deals 
ADD COLUMN total_calls integer DEFAULT 0;

-- Create a function to update total_calls when call notes are added/removed
CREATE OR REPLACE FUNCTION public.update_deal_total_calls()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_calls for the affected deal
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.deals 
    SET total_calls = (
      SELECT COUNT(*) 
      FROM public.call_notes 
      WHERE deal_id = NEW.deal_id
    )
    WHERE id = NEW.deal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.deals 
    SET total_calls = (
      SELECT COUNT(*) 
      FROM public.call_notes 
      WHERE deal_id = OLD.deal_id
    )
    WHERE id = OLD.deal_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to automatically update total_calls
CREATE TRIGGER update_deal_total_calls_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.call_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deal_total_calls();

-- Create a function to get first call date per deal
CREATE OR REPLACE FUNCTION public.get_first_call_date(deal_uuid uuid)
RETURNS DATE AS $$
BEGIN
  RETURN (
    SELECT MIN(call_date)::DATE
    FROM public.call_notes 
    WHERE deal_id = deal_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Update existing deals to set their current total_calls count
UPDATE public.deals 
SET total_calls = (
  SELECT COUNT(*) 
  FROM public.call_notes 
  WHERE call_notes.deal_id = deals.id
);