-- Add Date Reviewed by IC column to deals table
ALTER TABLE public.deals 
ADD COLUMN ic_review_date date;