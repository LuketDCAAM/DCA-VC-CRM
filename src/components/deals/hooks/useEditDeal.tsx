
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Deal } from '@/types/deal';

interface EditDealValues {
  company_name: string;
  website?: string;
  location?: string;
  description?: string;
  sector?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  pipeline_stage: string;
  round_stage?: string | null;
  deal_score?: number;
  deal_lead?: string;
  deal_source?: string;
  source_date?: string;
  round_size?: string;
  post_money_valuation?: string;
  revenue?: string;
  pitch_deck_url?: string;
  lead_investor?: string;
  other_investors?: string;
  next_steps?: string;
  pitchDeckFile?: File | null;
}

interface UseEditDealProps {
  deal: Deal;
  onSave: () => void;
}

export function useEditDeal({ deal, onSave }: UseEditDealProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleEditSubmit = async (values: EditDealValues) => {
    setIsUpdating(true);
    
    try {
      // Parse financial values
      const round_size = values.round_size ? Math.round(parseFloat(values.round_size) * 100) : null;
      const post_money_valuation = values.post_money_valuation ? Math.round(parseFloat(values.post_money_valuation) * 100) : null;
      const revenue = values.revenue ? Math.round(parseFloat(values.revenue) * 100) : null;

      // Update deal in database
      const { error: dealError } = await supabase
        .from('deals')
        .update({
          company_name: values.company_name,
          website: values.website || null,
          location: values.location || null,
          description: values.description || null,
          sector: values.sector || null,
          contact_name: values.contact_name || null,
          contact_email: values.contact_email || null,
          contact_phone: values.contact_phone || null,
          pipeline_stage: values.pipeline_stage as any,
          round_stage: values.round_stage as any || null,
          deal_score: values.deal_score || null,
          deal_lead: values.deal_lead || null,
          deal_source: values.deal_source || null,
          source_date: values.source_date || null,
          round_size,
          post_money_valuation,
          revenue,
          next_steps: values.next_steps || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (dealError) {
        console.error('Error updating deal:', dealError);
        throw dealError;
      }

      // Handle file upload if present
      if (values.pitchDeckFile) {
        const fileExt = values.pitchDeckFile.name.split('.').pop();
        const fileName = `${deal.id}_pitch_deck_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pitch-decks')
          .upload(fileName, values.pitchDeckFile);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('pitch-decks')
          .getPublicUrl(fileName);

        // Save file attachment record
        const { error: attachmentError } = await supabase
          .from('file_attachments')
          .insert({
            deal_id: deal.id,
            file_name: values.pitchDeckFile.name,
            file_url: urlData.publicUrl,
            file_type: 'file',
            file_size: values.pitchDeckFile.size,
            uploaded_by: deal.created_by
          });

        if (attachmentError) {
          console.error('Error saving file attachment:', attachmentError);
          throw attachmentError;
        }
      }

      // Handle pitch deck URL
      if (values.pitch_deck_url) {
        const { error: linkError } = await supabase
          .from('file_attachments')
          .insert({
            deal_id: deal.id,
            file_name: 'Pitch Deck Link',
            file_url: values.pitch_deck_url,
            file_type: 'link',
            file_size: 0,
            uploaded_by: deal.created_by
          });

        if (linkError) {
          console.error('Error saving pitch deck link:', linkError);
          throw linkError;
        }
      }

      // Handle investor information
      if (values.lead_investor) {
        const { error: leadError } = await supabase
          .from('file_attachments')
          .insert({
            deal_id: deal.id,
            file_name: 'Lead Investor',
            file_url: `investor:lead:${values.lead_investor}`,
            file_type: 'investor_info',
            file_size: 0,
            uploaded_by: deal.created_by
          });

        if (leadError) {
          console.error('Error saving lead investor:', leadError);
          throw leadError;
        }
      }

      if (values.other_investors) {
        const { error: otherError } = await supabase
          .from('file_attachments')
          .insert({
            deal_id: deal.id,
            file_name: 'Other Investors',
            file_url: `investor:other:${values.other_investors}`,
            file_type: 'investor_info',
            file_size: 0,
            uploaded_by: deal.created_by
          });

        if (otherError) {
          console.error('Error saving other investors:', otherError);
          throw otherError;
        }
      }

      toast({
        title: "Success",
        description: "Deal updated successfully",
      });

      onSave();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: "Failed to update deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    handleEditSubmit,
    isUpdating,
  };
}
