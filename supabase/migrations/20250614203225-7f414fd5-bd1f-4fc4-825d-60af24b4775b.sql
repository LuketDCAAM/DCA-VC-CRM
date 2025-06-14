
-- This trigger calls a function to create a portfolio company when a deal is marked as 'Invested'.
CREATE OR REPLACE TRIGGER on_deal_invested_trigger
AFTER UPDATE ON public.deals
FOR EACH ROW
WHEN (NEW.pipeline_stage = 'Invested' AND OLD.pipeline_stage IS DISTINCT FROM 'Invested')
EXECUTE FUNCTION public.handle_deal_invested();
