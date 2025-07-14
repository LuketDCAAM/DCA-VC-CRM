
-- Add last_call_date column to the investors table
ALTER TABLE public.investors 
ADD COLUMN last_call_date date;
