
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Constants } from '@/integrations/supabase/types';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';
import { PotentialDuplicate } from '@/types/duplicates';
import { PIPELINE_STAGES } from '@/hooks/deals/dealStagesConfig';

interface AddDealValues {
  company_name: string;
  website?: string;
  linkedin_url?: string;
  location?: string;
  description?: string;
  sector?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  pipeline_stage: string;
  round_stage?: string;
  deal_score?: number;
  deal_lead?: string;
  deal_source?: string;
  source_date?: string;
  round_size?: string;
  post_money_valuation?: string;
  revenue?: string;
  pitch_deck_url?: string;
  next_steps?: string;
  last_call_date?: string;
  pitchDeckFile?: File | null;
}

export function useAddDeal() {
  const [isLoading, setIsLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<PotentialDuplicate[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingDealData, setPendingDealData] = useState<AddDealValues | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkForDuplicates, isChecking } = useDuplicateDetection();

  const pipelineStages = PIPELINE_STAGES;
  const roundStages = Constants.public.Enums.round_stage;

  const checkDuplicatesAndProceed = async (values: AddDealValues): Promise<boolean> => {
    try {
      // Check for duplicates first
      const duplicateResult = await checkForDuplicates({
        company_name: values.company_name,
        website: values.website,
        linkedin_url: values.linkedin_url,
        contact_email: values.contact_email,
      });

      if (duplicateResult.hasDuplicates) {
        setDuplicates(duplicateResult.duplicates);
        setPendingDealData(values);
        setShowDuplicateDialog(true);
        return false; // Don't proceed yet, wait for user decision
      }

      // No duplicates found, proceed with creation
      return await createDeal(values);
    } catch (error) {
      console.error('Error in duplicate check:', error);
      // If duplicate check fails, proceed with creation
      return await createDeal(values);
    }
  };

  const handleAddSubmit = async (values: AddDealValues): Promise<boolean> => {
    return await checkDuplicatesAndProceed(values);
  };

  const handleDuplicateDialogProceed = async (): Promise<boolean> => {
    if (!pendingDealData) return false;
    
    setShowDuplicateDialog(false);
    const result = await createDeal(pendingDealData);
    setPendingDealData(null);
    setDuplicates([]);
    return result;
  };

  const handleDuplicateDialogCancel = () => {
    setShowDuplicateDialog(false);
    setPendingDealData(null);
    setDuplicates([]);
  };

  const createDeal = async (values: AddDealValues): Promise<boolean> => {
    console.log('useAddDeal - handleAddSubmit called with:', values);
    
    if (!user) {
      console.log('useAddDeal - No user found');
      toast({
        title: "Error",
        description: "You must be logged in to create a deal",
        variant: "destructive",
      });
      return false;
    }

    console.log('useAddDeal - User found, proceeding with deal creation');
    setIsLoading(true);

    try {
      // Parse financial values
      const round_size = values.round_size ? Math.round(parseFloat(values.round_size) * 100) : null;
      const post_money_valuation = values.post_money_valuation ? Math.round(parseFloat(values.post_money_valuation) * 100) : null;
      const revenue = values.revenue ? Math.round(parseFloat(values.revenue) * 100) : null;

      console.log('useAddDeal - Inserting deal with data:', {
        company_name: values.company_name,
        pipeline_stage: values.pipeline_stage,
        created_by: user.id,
      });

      // Insert deal
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          company_name: values.company_name,
          website: values.website || null,
          linkedin_url: values.linkedin_url || null,
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
          last_call_date: values.last_call_date || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (dealError) {
        console.error('useAddDeal - Error creating deal:', dealError);
        throw dealError;
      }

      console.log('useAddDeal - Deal created successfully:', dealData);

      // Handle file upload if present
      if (values.pitchDeckFile && dealData) {
        console.log('useAddDeal - Uploading pitch deck file');
        const fileExt = values.pitchDeckFile.name.split('.').pop();
        const fileName = `${dealData.id}_pitch_deck_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pitch-decks')
          .upload(fileName, values.pitchDeckFile);

        if (uploadError) {
          console.error('useAddDeal - Error uploading file:', uploadError);
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
            deal_id: dealData.id,
            file_name: values.pitchDeckFile.name,
            file_url: urlData.publicUrl,
            file_type: 'file',
            file_size: values.pitchDeckFile.size,
            uploaded_by: user.id
          });

        if (attachmentError) {
          console.error('useAddDeal - Error saving file attachment:', attachmentError);
          throw attachmentError;
        }
      }

      // Handle pitch deck URL
      if (values.pitch_deck_url && dealData) {
        console.log('useAddDeal - Saving pitch deck URL');
        const { error: linkError } = await supabase
          .from('file_attachments')
          .insert({
            deal_id: dealData.id,
            file_name: 'Pitch Deck Link',
            file_url: values.pitch_deck_url,
            file_type: 'link',
            file_size: 0,
            uploaded_by: user.id
          });

        if (linkError) {
          console.error('useAddDeal - Error saving pitch deck link:', linkError);
          throw linkError;
        }
      }

      console.log('useAddDeal - Deal creation completed successfully');
      toast({
        title: "Success",
        description: "Deal created successfully",
      });

      return true;
    } catch (error) {
      console.error('useAddDeal - Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleAddSubmit,
    isLoading: isLoading || isChecking,
    pipelineStages,
    roundStages,
    // Duplicate detection states and handlers
    duplicates,
    showDuplicateDialog,
    pendingDealData,
    handleDuplicateDialogProceed,
    handleDuplicateDialogCancel,
  };
}
