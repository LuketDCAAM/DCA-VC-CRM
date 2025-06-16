
-- Change 'Seen Not Reviewed' to 'Inactive' in the pipeline_stage enum
ALTER TYPE public.pipeline_stage RENAME VALUE 'Seen Not Reviewed' TO 'Inactive';
