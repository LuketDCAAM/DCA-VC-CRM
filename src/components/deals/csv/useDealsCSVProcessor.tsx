
import { useAuth } from '@/hooks/useAuth';
import { parseCurrency, parseDate, parseInteger } from './dealsCSVParsers';
import { 
  validatePipelineStage, 
  validateRoundStage, 
  validateEmail, 
  validateWebsite,
  validateLocation,
  validateCompanyName
} from './dealsCSVValidators';

export function useDealsCSVProcessor() {
  const { user } = useAuth();

  const processCSVData = async (data: any[], existingDeals: any[] = []) => {
    if (!user) {
      return { success: false, error: 'You must be logged in to import deals.' };
    }

    console.log('Processing CSV data with enhanced validation:', data.length, 'rows');

    const processedData = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const existingCompanies = existingDeals.map(deal => deal.company_name);

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
        // Validate company name and check for duplicates
        const companyValidation = validateCompanyName(row.company_name, existingCompanies);
        if (companyValidation.potentialDuplicates.length > 0) {
          warnings.push(`Row ${rowNum}: Potential duplicate company "${row.company_name}" (similar to: ${companyValidation.potentialDuplicates.join(', ')})`);
        }

        // Process location fields - prioritize individual city/state/country over location string
        let city = row.city ? String(row.city).trim() : null;
        let state_province = row.state_province ? String(row.state_province).trim() : null;
        let country = row.country ? String(row.country).trim() : null;
        let location = null;

        // If city/state/country are provided, construct location from them
        if (city || state_province || country) {
          const parts = [city, state_province, country].filter(Boolean);
          location = parts.join(', ');
        } 
        // Otherwise use the location field
        else if (row.location) {
          const locationValidation = validateLocation(row.location);
          if (row.location && !locationValidation.isValid) {
            warnings.push(`Row ${rowNum}: Location "${row.location}" could not be mapped to a known region`);
          } else if (row.location && locationValidation.confidence === 'low') {
            warnings.push(`Row ${rowNum}: Location "${row.location}" mapped with low confidence to ${locationValidation.suggestions[0]}`);
          }
          location = locationValidation.isValid ? locationValidation.normalizedLocation : String(row.location).trim();
        }

        // Process all the data with proper validation
        const processedRow = {
          company_name: companyValidation.normalizedName,
          description: row.description ? String(row.description).trim() : null,
          contact_name: row.contact_name ? String(row.contact_name).trim() : null,
          contact_email: row.contact_email ? String(row.contact_email).trim() : null,
          contact_phone: row.contact_phone ? String(row.contact_phone).trim() : null,
          website: row.website ? String(row.website).trim() : null,
          location,
          city,
          state_province,
          country,
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
        console.log(`Processed row ${rowNum} with enhanced validation:`, processedRow);

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: Failed to process data - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Final processed data:', processedData.length, 'valid rows');
    console.log('Errors found:', errors.length);
    console.log('Warnings found:', warnings.length);

    if (processedData.length === 0) {
      return { 
        success: false, 
        error: errors.length > 0 ? errors.join('; ') : 'No valid deals to import. Make sure "Company Name" is provided for each row.',
        errors,
        warnings 
      };
    }

    return { 
      success: true, 
      data: processedData, 
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      qualityScore: Math.round((processedData.length / (processedData.length + errors.length)) * 100)
    };
  };

  return {
    processCSVData,
  };
}
