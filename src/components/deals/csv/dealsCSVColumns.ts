
// CSV column definitions for deals import/export
export const csvTemplateColumns = [
  { key: 'company_name', label: 'Company Name', required: true },
  { key: 'description', label: 'Description' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'website', label: 'Website' },
  { key: 'location', label: 'Location' },
  { key: 'sector', label: 'Sector' },
  { key: 'pipeline_stage', label: 'Pipeline Stage' },
  { key: 'round_stage', label: 'Round Stage' },
  { key: 'round_size', label: 'Round Size ($)' },
  { key: 'post_money_valuation', label: 'Post Money Valuation ($)' },
  { key: 'revenue', label: 'Revenue ($)' },
  { key: 'deal_score', label: 'Deal Score (0-100)' },
  { key: 'deal_lead', label: 'Deal Lead' },
  { key: 'deal_source', label: 'Deal Source' },
  { key: 'source_date', label: 'Source Date (YYYY-MM-DD)' },
];

export const exportColumns = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'description', label: 'Description' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'pipeline_stage', label: 'Pipeline Stage' },
  { key: 'round_stage', label: 'Round Stage' },
  { key: 'deal_score', label: 'Deal Score' },
  { key: 'location', label: 'Location' },
  { key: 'sector', label: 'Sector' },
  { key: 'website', label: 'Website' },
  { key: 'created_at', label: 'Date Added' },
  { key: 'deal_lead', label: 'Deal Lead' },
  { key: 'deal_source', label: 'Deal Source' },
  { key: 'source_date', label: 'Source Date' },
];
