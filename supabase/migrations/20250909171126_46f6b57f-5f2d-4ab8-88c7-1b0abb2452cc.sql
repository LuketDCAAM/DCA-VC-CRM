-- Create enum for investment vehicle types
CREATE TYPE public.investment_vehicle AS ENUM (
  'Preferred Equity',
  'Common Equity', 
  'Convertible Note',
  'SAFE Note',
  'Other'
);

-- Add investment_vehicle column to deals table
ALTER TABLE public.deals 
ADD COLUMN investment_vehicle public.investment_vehicle;