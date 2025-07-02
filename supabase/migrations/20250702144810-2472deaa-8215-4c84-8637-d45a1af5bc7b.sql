
-- Update pipeline_stage enum by adding new values and removing old ones
-- We need to be careful with the order since there might be existing data

-- First, add the new 'Scorecard' value to the enum
ALTER TYPE public.pipeline_stage ADD VALUE 'Scorecard' AFTER 'First Meeting';

-- Now we need to update existing data before removing old enum values
-- Update 'First Meeting' to 'Scorecard' first
UPDATE public.deals SET pipeline_stage = 'Scorecard' WHERE pipeline_stage = 'First Meeting';

-- Update 'Initial Contact' to 'First Meeting'  
UPDATE public.deals SET pipeline_stage = 'First Meeting' WHERE pipeline_stage = 'Initial Contact';

-- Update 'Initial Review' to 'Initial Contact'
UPDATE public.deals SET pipeline_stage = 'Initial Contact' WHERE pipeline_stage = 'Initial Review';

-- Note: We cannot directly remove enum values from PostgreSQL enums
-- The old enum values will remain in the type definition but won't be used
-- This is a PostgreSQL limitation - enum values cannot be dropped once added

-- If you need a clean enum without the old values, you would need to:
-- 1. Create a new enum type with only the desired values
-- 2. Add a new column with the new enum type
-- 3. Migrate data to the new column
-- 4. Drop the old column and rename the new one
-- 
-- For now, we'll keep the existing approach which is safer and maintains data integrity
