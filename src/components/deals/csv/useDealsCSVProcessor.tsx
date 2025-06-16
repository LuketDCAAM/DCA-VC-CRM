
import { useAuth } from '@/hooks/useAuth';
import { parseCurrency, parseDate, parseInteger } from './dealsCSVParsers';
import { validatePipelineStage, validateRoundStage, validateEmail, validateWebsite } from './dealsCSVValidators';

export function useDealsCSVProcessor() {
  const { user } = useAuth();

  const processCSVData = async (data: any[]) => {
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
          if (!validateEmail(processedRow.contact_email)) {
            errors.push(`Row ${rowNum}: Invalid email format for Contact Email`);
            continue;
          }
        }

        // Validate website format if provided
        if (processedRow.website) {
          processedRow.website = validateWebsite(processedRow.website);
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
    processCSVData,
  };
}
