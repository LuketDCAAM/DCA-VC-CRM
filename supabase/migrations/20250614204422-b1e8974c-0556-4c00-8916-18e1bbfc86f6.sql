
-- Enable Realtime on deals and portfolio_companies tables
ALTER TABLE public.deals REPLICA IDENTITY FULL;
ALTER TABLE public.portfolio_companies REPLICA IDENTITY FULL;

-- Add tables to the publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_companies;

-- Recreate the trigger to create a portfolio company when a deal is invested
CREATE OR REPLACE TRIGGER on_deal_invested_trigger
AFTER UPDATE ON public.deals
FOR EACH ROW
WHEN (NEW.pipeline_stage = 'Invested' AND OLD.pipeline_stage IS DISTINCT FROM 'Invested')
EXECUTE FUNCTION public.handle_deal_invested();
