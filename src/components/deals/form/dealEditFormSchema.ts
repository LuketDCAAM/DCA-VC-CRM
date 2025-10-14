
import * as z from 'zod';
import { Constants } from '@/integrations/supabase/types';

export const dealFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.'),
  website: z.string().url({ message: "Invalid URL." }).or(z.literal('')).optional(),
  linkedin_url: z.string().url({ message: "Invalid URL." }).or(z.literal('')).optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email({ message: "Invalid email address." }).or(z.literal('')).optional(),
  contact_phone: z.string().optional(),
  pipeline_stage: z.enum(Constants.public.Enums.pipeline_stage as readonly [string, ...string[]] as [string, ...string[]]),
  round_stage: z.enum(Constants.public.Enums.round_stage as readonly [string, ...string[]] as [string, ...string[]]).nullable().optional(),
  investment_vehicle: z.enum(Constants.public.Enums.investment_vehicle as readonly [string, ...string[]] as [string, ...string[]]).nullable().optional(),
  deal_score: z.number().min(0).max(100).optional(),
  deal_lead: z.string().optional(),
  deal_source: z.string().optional(),
  source_date: z.string().optional(),
  round_size: z.string().optional(), 
  post_money_valuation: z.string().optional(),
  revenue: z.string().optional(),
  pitch_deck_url: z.string().url({ message: "Invalid URL." }).or(z.literal('')).optional(),
  lead_investor: z.string().optional(),
  other_investors: z.string().optional(),
  next_steps: z.string().optional(),
  last_call_date: z.string().optional(),
  ic_review_date: z.string().optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
