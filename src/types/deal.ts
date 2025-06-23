// @/types/deal.ts

export type PipelineStage =
  | 'Inactive'
  | 'Initial Review'
  | 'Initial Contact'
  | 'First Meeting'
  | 'Due Diligence'
  | 'Term Sheet'
  | 'Legal Review'
  | 'Invested'
  | 'Passed';

export type RoundStage =
  | 'Pre-Seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Bridge'
  | 'Growth';

export interface Deal {
  id: string;
  company_name: string;
  contact_name?: string;
  pipeline_stage: PipelineStage;
  round_stage: RoundStage;
  round_size?: number;
  location?: string;
  deal_score?: number;
  deal_source?: string;
  created_at: string;
  post_money_valuation?: number;
  revenue?: number;
  sector?: string;
  deal_lead?: string;
  source_date?: string;
  description?: string;
  [key: string]: any;
}
