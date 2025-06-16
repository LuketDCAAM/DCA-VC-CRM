
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

  const exportColumns = [
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

  // Improved currency parsing with better validation
  const parseCurrency = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') return null;
    
    // Convert to string and remove currency symbols, commas, and spaces
    const cleanValue = String(value).replace(/[\$,\s]/g, '').trim();
    if (cleanValue === '') return null;
    
    const num = parseFloat(cleanValue);
    if (isNaN(num) || num < 0) return null;
    
    // Convert to cents (multiply by 100) and round to avoid floating point issues
    return Math.round(num * 100);
  };

  // Improved date parsing
  const parseDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
      const date = new Date(dateStr.trim());
      if (isNaN(date.getTime())) return null;
      
      // Return in YYYY-MM-DD format
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  };

  // Improved integer parsing for deal score
  const parseInteger = (value: string | number | null | undefined, min: number = 0, max: number = 100): number | null => {
    if (value === null || value === undefined || value === '') return null;
    
    const cleanValue = String(value).replace(/[^0-9.-]/g, '');
    if (cleanValue === '') return null;
    
    const num = parseInt(cleanValue, 10);
    if (isNaN(num) || num < min || num > max) return null;
    
    return num;
  };

  // Validate pipeline stage
  const validatePipelineStage = (stage: string | null | undefined): string => {
    if (!stage) return 'Initial Contact';
    
    const validStages = [
      'Seen Not Reviewed',
      'Initial Review', 
      'Initial Contact',
      'First Meeting',
      'Due Diligence',
      'Term Sheet',
      'Legal Review',
      'Invested',
      'Passed'
    ];
    
    const normalizedStage = stage.trim();
    return validStages.includes(normalizedStage) ? normalizedStage : 'Initial Contact';
  };

  // Validate round stage
  const validateRoundStage = (stage: string | null | undefined): string | null => {
    if (!stage || stage.trim() === '') return null;
    
    const validStages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bridge', 'Growth'];
    const normalizedStage = stage.trim();
    
    return validStages.includes(normalizedStage) ? normalizedStage : null;
  };

  const handleCSVImport = async (data: any[]) => {
    if (!user) {
      return { success: false, error: 'You must be logged in to import deals.' };
    }

    console.log('Processing CSV data:', data.length, 'rows');

    const processedData = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      // Skip rows without company name
      if (!row.company_name || String(row.company_name).trim() === '') {
        if (Object.values(row).some(val => val && String(val).trim() !== '')) {
          errors.push(`Row ${rowNum}: Company Name is required`);
        }
        continue;
      }

      try {
        // Process all the data with proper validation
        const processedRow = {
          company_name: String(row.company_name).trim(),
          description: row.description ? String(row.description).trim() : null,
          contact_name: row.contact_name ? String(row.contact_name).trim() : null,
          contact_email: row.contact_email ? String(row.contact_email).trim() : null,
          contact_phone: row.contact_phone ? String(row.contact_phone).trim() : null,
          website: row.website ? String(row.website).trim() : null,
          location: row.location ? String(row.location).trim() : null,
          sector: row.sector ? String(row.sector).trim() : null,
          pipeline_stage: validatePipelineStage(row.pipeline_stage),
          round_stage: validateRoundStage(row.round_stage),
          round_size: parseCurrency(row.round_size),
          post_money_valuation: parseCurrency(row.post_money_valuation),
          revenue: parseCurrency(row.revenue),
          deal_score: parseInteger(row.deal_score, 0, 100),
          deal_lead: row.deal_lead ? String(row.deal_lead).trim() : null,
          deal_source: row.deal_source ? String(row.deal_source).trim() : null,
          source_date: parseDate(row.source_date),
          created_by: user.id,
        };

        // Validate required fields
        if (processedRow.company_name.length === 0) {
          errors.push(`Row ${rowNum}: Company Name cannot be empty`);
          continue;
        }

        // Validate email format if provided
        if (processedRow.contact_email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(processedRow.contact_email)) {
            errors.push(`Row ${rowNum}: Invalid email format for Contact Email`);
            continue;
          }
        }

        // Validate website format if provided
        if (processedRow.website && !processedRow.website.startsWith('http')) {
          processedRow.website = `https://${processedRow.website}`;
        }

        processedData.push(processedRow);
        console.log(`Processed row ${rowNum}:`, processedRow);

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: Failed to process data - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Final processed data:', processedData.length, 'valid rows');
    console.log('Errors found:', errors.length);

    if (processedData.length === 0) {
      return { 
        success: false, 
        error: errors.length > 0 ? errors.join('; ') : 'No valid deals to import. Make sure "Company Name" is provided for each row.',
        errors 
      };
    }

    return { success: true, data: processedData, errors: errors.length > 0 ? errors : undefined };
  };

  return {
    csvTemplateColumns,
    exportColumns,
    handleCSVImport,
  };
}
