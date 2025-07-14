
export interface LPEngagement {
  id: string;
  lp_name: string;
  lp_type?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  linkedin_url?: string;
  relationship_owner?: string;
  commitment_amount?: number;
  committed_date?: string;
  capital_called: number;
  capital_returned: number;
  engagement_stage: 'Prospect' | 'Initial Contact' | 'Due Diligence' | 'Negotiation' | 'Committed' | 'Active' | 'Inactive' | 'Declined';
  location?: string;
  investment_focus?: string[];
  ticket_size_min?: number;
  ticket_size_max?: number;
  last_interaction_date?: string;
  next_steps?: string;
  notes?: string;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
