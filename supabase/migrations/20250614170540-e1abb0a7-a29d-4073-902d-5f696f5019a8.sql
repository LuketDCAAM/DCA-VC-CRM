
-- Add 'Initial Review' to the pipeline_stage enum type
ALTER TYPE public.pipeline_stage ADD VALUE 'Initial Review' AFTER 'Seen Not Reviewed';
