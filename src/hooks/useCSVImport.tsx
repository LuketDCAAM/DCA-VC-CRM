
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

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          const dealData = {
            company_name: row.company_name,
            contact_name: row.contact_name || null,
            contact_email: row.contact_email || null,
            contact_phone: row.contact_phone || null,
            website: row.website || null,
            location: row.location || null,
            pipeline_stage: row.pipeline_stage || 'Initial Contact',
            round_stage: row.round_stage || null,
            round_size: row.round_size ? parseInt(row.round_size) * 100 : null, // Convert to cents
            post_money_valuation: row.post_money_valuation ? parseInt(row.post_money_valuation) * 100 : null,
            revenue: row.revenue ? parseInt(row.revenue) * 100 : null,
            created_by: user.id,
          };

          const { error } = await supabase
            .from('deals')
            .insert([dealData]);

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
