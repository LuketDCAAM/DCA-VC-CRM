CREATE INDEX IF NOT EXISTS deals_pipeline_stage_idx ON public.deals (pipeline_stage);
CREATE INDEX IF NOT EXISTS deals_pipeline_stage_created_at_idx ON public.deals (pipeline_stage, created_at DESC);
CREATE INDEX IF NOT EXISTS deals_created_by_idx ON public.deals (created_by);