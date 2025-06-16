
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: boolean;
  imported?: number;
  errors?: string[];
}

export function useCSVImport() {
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const importDeals = async (data: any[]): Promise<ImportResult> => {
    if (!user) throw new Error('User not authenticated');

    setImporting(true);
    const errors: string[] = [];
    let imported = 0;

    console.log('Starting database import for', data.length, 'deals');

    try {
      // Process deals in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const row = batch[j];
          const originalIndex = i + j + 1;
          
          try {
            // Prepare the deal data according to the database schema
            const dealData = {
              company_name: row.company_name,
              description: row.description,
              contact_name: row.contact_name,
              contact_email: row.contact_email,
              contact_phone: row.contact_phone,
              website: row.website,
              location: row.location,
              pipeline_stage: row.pipeline_stage,
              round_stage: row.round_stage,
              round_size: row.round_size, // Already in cents from processing
              post_money_valuation: row.post_money_valuation, // Already in cents
              revenue: row.revenue, // Already in cents
              deal_score: row.deal_score,
              deal_lead: row.deal_lead,
              deal_source: row.deal_source,
              source_date: row.source_date,
              created_by: user.id,
            };

            console.log(`Inserting deal ${originalIndex}:`, dealData);

            const { data: insertedData, error } = await supabase
              .from('deals')
              .insert([dealData])
              .select();

            if (error) {
              console.error(`Database error for row ${originalIndex}:`, error);
              errors.push(`Row ${originalIndex}: ${error.message}`);
            } else {
              console.log(`Successfully inserted deal ${originalIndex}:`, insertedData);
              imported++;
            }
          } catch (err) {
            console.error(`Processing error for row ${originalIndex}:`, err);
            errors.push(`Row ${originalIndex}: ${err instanceof Error ? err.message : 'Processing failed'}`);
          }
        }

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Import completed: ${imported} successful, ${errors.length} errors`);

      // Show appropriate toast message
      if (imported > 0 && errors.length === 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${imported} deals`,
        });
      } else if (imported > 0 && errors.length > 0) {
        toast({
          title: "Partial import",
          description: `Imported ${imported} deals with ${errors.length} errors`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import failed",
          description: "No deals were imported due to errors",
          variant: "destructive",
        });
      }

      return {
        success: imported > 0,
        imported,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Import process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        imported,
        errors: [...errors, `Import process failed: ${errorMessage}`]
      };
    } finally {
      setImporting(false);
    }
  };

  const importPortfolioCompanies = async (data: any[]): Promise<ImportResult> => {
    if (!user) throw new Error('User not authenticated');

    setImporting(true);
    const errors: string[] = [];
    let imported = 0;

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const companyData = {
            company_name: row.company_name,
            status: row.status || 'Active',
            tags: row.tags ? row.tags.split(';').map((tag: string) => tag.trim()) : null,
            relationship_owner: row.relationship_owner || null,
            created_by: user.id,
          };

          const { error } = await supabase
            .from('portfolio_companies')
            .insert([companyData]);

          if (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Row ${i + 1}: Invalid data format`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors: errors.length > 0 ? errors : undefined
      };
    } finally {
      setImporting(false);
    }
  };

  const importInvestors = async (data: any[]): Promise<ImportResult> => {
    if (!user) throw new Error('User not authenticated');

    setImporting(true);
    const errors: string[] = [];
    let imported = 0;

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const investorData = {
            contact_name: row.contact_name,
            contact_email: row.contact_email || null,
            contact_phone: row.contact_phone || null,
            firm_name: row.firm_name || null,
            firm_website: row.firm_website || null,
            location: row.location || null,
            preferred_investment_stage: row.preferred_investment_stage || null,
            average_check_size: row.average_check_size ? parseInt(row.average_check_size) * 100 : null,
            preferred_sectors: row.preferred_sectors ? row.preferred_sectors.split(';').map((sector: string) => sector.trim()) : null,
            tags: row.tags ? row.tags.split(';').map((tag: string) => tag.trim()) : null,
            relationship_owner: row.relationship_owner || null,
            created_by: user.id,
          };

          const { error } = await supabase
            .from('investors')
            .insert([investorData]);

          if (error) {
            errors.push(`Row ${i + 1}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Row ${i + 1}: Invalid data format`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors: errors.length > 0 ? errors : undefined
      };
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    importDeals,
    importPortfolioCompanies,
    importInvestors,
  };
}
