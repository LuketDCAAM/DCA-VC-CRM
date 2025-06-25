
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names for attachments
import { Deal, DealUpdate } from '@/types/deal';
import { UseFormReturn } from 'react-hook-form'; // Import for typing the form object

interface UseEditDealProps {
  deal: Deal;
  onSave: () => void;
}

// This type mirrors the form values that onSubmit will receive
interface EditDealFormValues {
  company_name: string;
  website: string | null | undefined;
  location: string | null | undefined;
  description: string | null | undefined;
  sector: string | null | undefined;
  contact_name: string | null | undefined;
  contact_email: string | null | undefined;
  contact_phone: string | null | undefined;
  pipeline_stage: Deal['pipeline_stage']; // Use directly from Deal type
  round_stage: Deal['round_stage'] | null | undefined; // Use directly from Deal type
  deal_score: number | null | undefined;
  deal_lead: string | null | undefined;
  deal_source: string | null | undefined;
  source_date: string | null | undefined;
  round_size: string | null | undefined; // String from form input
  post_money_valuation: string | null | undefined; // String from form input
  revenue: string | null | undefined; // String from form input
  pitch_deck_url?: string | null; // Optional, for direct links
  pitchDeckFile?: File | null; // Optional, for file uploads
}

export function useEditDeal({ deal, onSave }: UseEditDealProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper functions for currency formatting/parsing
  const parseCurrency = (value: string | null | undefined) => {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : Math.round(num * 100);
  };

  const handleEditSubmit = async (values: EditDealFormValues) => {
    setIsUpdating(true);
    try {
      // 1. Prepare data for the 'deals' table update
      // Only include fields that are actually columns in 'deals' table
      const updateData: DealUpdate = {
        company_name: values.company_name,
        contact_name: values.contact_name || null,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        website: values.website || null,
        location: values.location || null,
        sector: values.sector || null,
        description: values.description || null,
        pipeline_stage: values.pipeline_stage,
        round_stage: values.round_stage || null, // Ensure null if undefined/empty string from form
        deal_score: values.deal_score,
        deal_lead: values.deal_lead || null,
        deal_source: values.deal_source || null,
        source_date: values.source_date || null,
        round_size: parseCurrency(values.round_size),
        post_money_valuation: parseCurrency(values.post_money_valuation),
        revenue: parseCurrency(values.revenue),
        updated_at: new Date().toISOString(),
      };

      // 2. Update the deal record in the 'deals' table
      const { error: dealUpdateError } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (dealUpdateError) throw dealUpdateError;

      // 3. Handle Pitch Deck File Upload (if a new file is selected)
      if (values.pitchDeckFile) {
        const file = values.pitchDeckFile;
        const fileExtension = file.name.split('.').pop();
        const filePath = `deal_attachments/${deal.id}/${uuidv4()}.${fileExtension}`; 

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pitch-decks') // Ensure this bucket exists and has RLS policies configured
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, 
          });

        if (uploadError) {
          console.error('Error uploading pitch deck file:', uploadError);
          toast({
            title: "Upload Error",
            description: `Failed to upload pitch deck file: ${uploadError.message}`,
            variant: "destructive",
          });
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('pitch-decks')
            .getPublicUrl(filePath);
          
          if (publicUrlData) {
            const { error: attachmentError } = await supabase.from('file_attachments').insert({
              deal_id: deal.id, 
              file_name: file.name,
              file_url: publicUrlData.publicUrl,
              file_type: file.type || 'application/octet-stream',
              file_size: file.size,
              uploaded_by: deal.created_by, // Use original deal's creator or auth.uid()
            });

            if (attachmentError) {
              console.error('Error recording file attachment:', attachmentError);
              toast({
                title: "Database Error",
                description: `Failed to record pitch deck file in database: ${attachmentError.message}`,
                variant: "destructive",
              });
            } else {
              toast({
                title: "File Uploaded",
                description: `Pitch deck file "${file.name}" uploaded successfully.`,
              });
            }
          }
        }
      }

      // 4. Handle Pitch Deck URL (if provided/changed)
      const currentPitchDeckUrl = (deal as any).pitch_deck_url || ''; // Get current URL from deal object
      if (values.pitch_deck_url && values.pitch_deck_url !== currentPitchDeckUrl) {
        // Here, you might want to consider updating an *existing* attachment record
        // if the old URL was from a file_attachment. For simplicity, this adds a new one.
        // For a true update, you'd fetch existing file_attachments for this deal.id and file_type 'link',
        // and update that specific record instead of always inserting.
        
        // As per previous logic, check for exact duplicate before inserting
        const { data: existingLinks, error: existingLinksError } = await supabase
          .from('file_attachments')
          .select('id')
          .eq('deal_id', deal.id)
          .eq('file_url', values.pitch_deck_url)
          .single();

        if (existingLinksError && existingLinksError.code !== 'PGRST116') {
          console.error('Error checking for existing link:', existingLinksError);
        }

        if (!existingLinks) { 
            const { error: linkAttachmentError } = await supabase.from('file_attachments').insert({
                deal_id: deal.id,
                file_name: `Pitch Deck Link: ${values.company_name}`, 
                file_url: values.pitch_deck_url,
                file_type: 'link', 
                file_size: 0, 
                uploaded_by: deal.created_by, // Or auth.uid()
            });

            if (linkAttachmentError) {
                console.error('Error recording pitch deck URL:', linkAttachmentError);
                toast({
                    title: "Database Error",
                    description: `Failed to record pitch deck URL: ${linkAttachmentError.message}`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Link Added",
                    description: `Pitch deck link added successfully.`,
                });
            }
        }
      }

      // 5. Success Toast & Invalidation
      if (values.pipeline_stage === 'Invested' && deal.pipeline_stage !== 'Invested') {
        toast({
          title: "Deal Invested!",
          description: `"${values.company_name}" has been added to your portfolio.`,
        });
      } else {
        toast({
          title: "Deal updated",
          description: "The deal has been successfully updated.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ['deals'] });
      if (values.pipeline_stage === 'Invested') {
        queryClient.invalidateQueries({ queryKey: ['portfolioCompanies'] });
      }

      onSave(); // Trigger the callback to close the form or refresh data
    } catch (error: any) {
      console.error("Error during deal update:", error);
      toast({
        title: "Error updating deal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return { handleEditSubmit, isUpdating, parseCurrency };
}
