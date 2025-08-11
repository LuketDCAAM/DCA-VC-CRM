export interface PotentialDuplicate {
  deal_id: string;
  company_name: string;
  website?: string;
  linkedin_url?: string;
  contact_email?: string;
  contact_name?: string;
  pipeline_stage: string;
  created_at: string;
  confidence_level: 'high' | 'medium' | 'low';
  confidence_score: number;
  match_reasons: string[];
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: PotentialDuplicate[];
}