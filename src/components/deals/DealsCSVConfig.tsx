
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useDealsCSVConfig() {
  const { user } = useAuth();

  const csvTemplateColumns = [
    { key: 'company_name', label: 'Company Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'contact_phone', label: 'Contact Phone' },
    { key: 'website', label: 'Website' },
    { key: 'location', label: 'Location' },
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

  const exportColumns = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'description', label: 'Description' },
    { key: 'contact_name', label: 'Contact Name' },
    { key: 'contact_email', label: 'Contact Email' },
    { key: 'pipeline_stage', label: 'Pipeline Stage' },
    { key: 'round_stage', label: 'Round Stage' },
    { key: 'deal_score', label: 'Deal Score' },
    { key: 'location', label: 'Location' },
    { key: 'website', label: 'Website' },
    { key: 'created_at', label: 'Date Added' },
    { key: 'deal_lead', label: 'Deal Lead' },
    { key: 'deal_source', label: 'Deal Source' },
    { key: 'source_date', label: 'Source Date' },
  ];

  const handleCSVImport = async (data: any[]) => {
    if (!user) {
      return { success: false, error: 'You must be logged in to import deals.' };
    }

    const parseCurrency = (value: string | number | null) => {
      if (value === null || value === undefined || value === '') return null;
      const num = parseFloat(String(value).replace(/[^0-9.-]+/g,""));
      return isNaN(num) ? null : Math.round(num * 100);
    };

    const processedData = data
      .filter(row => row.company_name)
      .map(row => ({
        company_name: row.company_name,
        description: row.description || null,
        contact_name: row.contact_name || null,
        contact_email: row.contact_email || null,
        contact_phone: row.contact_phone || null,
        website: row.website || null,
        location: row.location || null,
        pipeline_stage: row.pipeline_stage || 'Initial Contact',
        round_stage: row.round_stage || null,
        round_size: parseCurrency(row.round_size),
        post_money_valuation: parseCurrency(row.post_money_valuation),
        revenue: parseCurrency(row.revenue),
        deal_score: row.deal_score ? parseInt(String(row.deal_score).replace(/[^0-9]/g, ''), 10) : null,
        deal_lead: row.deal_lead || null,
        deal_source: row.deal_source || null,
        source_date: row.source_date || null,
        created_by: user.id,
      }));

    if (processedData.length === 0) {
      return { success: false, error: 'No valid deals to import. Make sure "Company Name" is provided for each row.' };
    }

    return { success: true, data: processedData };
  };

  return {
    csvTemplateColumns,
    exportColumns,
    handleCSVImport,
  };
}
