
-- Add 'Seen Not Reviewed' to the pipeline_stage enum type
ALTER TYPE public.pipeline_stage ADD VALUE 'Seen Not Reviewed' BEFORE 'Initial Contact';
