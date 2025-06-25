import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PipelineStage, RoundStage, DealInsert } from '@/types/deal'; 
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

// These arrays should ideally derive from your Supabase generated types if you want to avoid manual sync.
// For now, they are explicitly typed to match the Supabase enum for consistency.
const pipelineStages: PipelineStage[] = [
  'Inactive',
  'Initial Review',
  'Initial Contact',
  'First Meeting',
  'Due Diligence',
  'Memo',
  'Legal Review',
  'Invested',
  'Passed'
];

const roundStages: RoundStage[] = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Bridge',
  'Growth'
];

export interface AddDealFormData {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  location: string;
  sector: string;
  description: string;
  pipeline_stage: PipelineStage; 
  round_stage: RoundStage | ''; 
  round_size: string; 
  post_money_valuation: string; 
  revenue: string; 
  deal_score: number | null;
  deal_lead: string;
  deal_source: string;
  source_date: string;
  // New fields for pitch deck
  pitch_deck_url?: string | null; // For direct links
  pitchDeckFile?: File | null; // For file uploads (client-side only, not for DB)
}

export const defaultFormData: AddDealFormData = {
  company_name: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  location: '',
  sector: '',
  description: '',
  pipeline_stage: 'Inactive', 
  round_stage: '',
  round_size: '',
  post_money_valuation: '',
  revenue: '',
  deal_score: null,
  deal_lead: '',
  deal_source: '',
  source_date: '',
  pitch_deck_url: null, // Default to null for new field
  pitchDeckFile: null,  // Default to null for new field
};

export function useAddDeal() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const parseAndScaleCurrency = (value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : Math.round(num * 100); 
  };

  const createDeal = async (formData: AddDealFormData, onSuccess: () => void) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a deal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare deal data for insertion into the 'deals' table
      const dealData: DealInsert = { 
        company_name: formData.company_name,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website: formData.website || null,
        location: formData.location || null,
        sector: formData.sector || null,
        description: formData.description || null,
        pipeline_stage: formData.pipeline_stage,
        round_stage: formData.round_stage === '' ? null : formData.round_stage, 
        round_size: parseAndScaleCurrency(formData.round_size),
        post_money_valuation: parseAndScaleCurrency(formData.post_money_valuation),
        revenue: parseAndScaleCurrency(formData.revenue),
        deal_score: formData.deal_score,
        deal_lead: formData.deal_lead || null,
        deal_source: formData.deal_source || null,
        source_date: formData.source_date || null,
        created_by: user.id,
        // tags: formData.tags || null, // Assuming tags might be added later
        // last_call_date: null, // Assuming this is set separately
        // relationship_owner: null, // Assuming this is set separately
      };

      // 1. Insert the deal first to get its ID
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert([dealData])
        .select(); // Select the newly created deal to get its ID

      if (dealError) throw dealError;
      if (!newDeal || newDeal.length === 0) throw new Error("Failed to retrieve new deal ID.");

      const dealId = newDeal[0].id;
      
      // 2. Handle Pitch Deck File Upload (if a file is selected)
      if (formData.pitchDeckFile) {
        const file = formData.pitchDeckFile;
        const fileExtension = file.name.split('.').pop();
        const filePath = `public/${user.id}/${uuidv4()}.${fileExtension}`; // e.g., 'public/user_id/uuid.pdf'

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pitch-decks') // Use a dedicated bucket for pitch decks
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading pitch deck file:', uploadError);
          toast({
            title: "Upload Error",
            description: `Failed to upload pitch deck: ${uploadError.message}`,
            variant: "destructive",
          });
          // Continue creating deal, but log file upload error
        } else {
          // Get public URL for the uploaded file
          const { data: publicUrlData } = supabase.storage
            .from('pitch-decks')
            .getPublicUrl(filePath);
          
          if (publicUrlData) {
            // Insert attachment record into file_attachments table
            const { error: attachmentError } = await supabase.from('file_attachments').insert({
              deal_id: dealId,
              file_name: file.name,
              file_url: publicUrlData.publicUrl,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user.id,
            });

            if (attachmentError) {
              console.error('Error recording file attachment:', attachmentError);
              toast({
                title: "Database Error",
                description: `Failed to record pitch deck in database: ${attachmentError.message}`,
                variant: "destructive",
              });
            }
          }
        }
      }

      // 3. Handle Pitch Deck URL (if provided)
      if (formData.pitch_deck_url) {
        const { error: linkAttachmentError } = await supabase.from('file_attachments').insert({
          deal_id: dealId,
          file_name: `Pitch Deck Link: ${formData.company_name}`, // A descriptive name for the link
          file_url: formData.pitch_deck_url,
          file_type: 'link', // Custom type for links
          file_size: 0, // No file size for a link
          uploaded_by: user.id,
        });

        if (linkAttachmentError) {
          console.error('Error recording pitch deck URL:', linkAttachmentError);
          toast({
            title: "Database Error",
            description: `Failed to record pitch deck URL in database: ${linkAttachmentError.message}`,
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Deal created successfully",
        description: `${formData.company_name} has been added to your pipeline.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Caught error in createDeal:", error);
      toast({
        title: "Error creating deal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createDeal,
    pipelineStages, 
    roundStages,    
  };
}
