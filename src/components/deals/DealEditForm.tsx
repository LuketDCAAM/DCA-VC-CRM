
import React, { useEffect } from 'react';
import { Deal } from '@/types/deal'; 
import { Form } from '@/components/ui/form'; 
import { useEditDeal } from './hooks/useEditDeal';
import { supabase } from '@/integrations/supabase/client';
import { useDealEditForm } from './form/useDealEditForm';
import { DealEditFormHeader } from './form/DealEditFormHeader';
import { DealEditCompanySection } from './form/DealEditCompanySection';
import { DealEditContactSection } from './form/DealEditContactSection';
import { DealEditStatusSection } from './form/DealEditStatusSection';
import { DealEditFinancialSection } from './form/DealEditFinancialSection';
import { DealEditNextStepsSection } from './form/DealEditNextStepsSection';
import { DealEditInvestorSection } from './form/DealEditInvestorSection';
import { DealEditAttachmentsSection } from './form/DealEditAttachmentsSection';
import { DealTaskSection } from './form/DealTaskSection';
import { DealFormValues } from './form/dealEditFormSchema';

interface DealEditFormProps {
  deal: Deal;
  onSave: () => void;
  onCancel: () => void;
}

export function DealEditForm({ deal, onSave, onCancel }: DealEditFormProps) {
  const { form, pitchDeckFile, handleFileChange } = useDealEditForm({ deal });
  const { handleEditSubmit, isUpdating } = useEditDeal({ deal, onSave });

  const onSubmit = async (values: DealFormValues) => {
    console.log('Form submission values:', values);
    console.log('Next steps value:', values.next_steps);
    
    const submitValues = {
      company_name: values.company_name,
      website: values.website || '',
      linkedin_url: values.linkedin_url || '',
      city: values.city || '',
      state_province: values.state_province || '',
      country: values.country || '',
      description: values.description || '',
      sector: values.sector || '',
      contact_name: values.contact_name || '',
      contact_email: values.contact_email || '',
      contact_phone: values.contact_phone || '',
      pipeline_stage: values.pipeline_stage,
      round_stage: values.round_stage || null,
      investment_vehicle: values.investment_vehicle || null,
      deal_score: values.deal_score,
      deal_lead: values.deal_lead || '',
      deal_source: values.deal_source || '',
      source_date: values.source_date || '',
      round_size: values.round_size || '',
      post_money_valuation: values.post_money_valuation || '',
      revenue: values.revenue || '',
      pitch_deck_url: values.pitch_deck_url || '',
      lead_investor: values.lead_investor || '',
      other_investors: values.other_investors || '',
      next_steps: values.next_steps || '',
      pitchDeckFile
    };
    
    console.log('Submit values with next_steps:', submitValues.next_steps);
    await handleEditSubmit(submitValues);
  };

  useEffect(() => {
    const fetchExistingData = async () => {
      const { data: attachments, error } = await supabase
        .from('file_attachments')
        .select('file_name, file_url, file_type')
        .eq('deal_id', deal.id);

      if (error) {
        console.error("Error fetching existing attachments:", error);
        return;
      }

      if (attachments) {
        const pitchDeckLink = attachments.find(att => att.file_type === 'link');
        if (pitchDeckLink) {
          form.setValue('pitch_deck_url', pitchDeckLink.file_url);
        }

        const leadInvestorInfo = attachments.find(att => 
          att.file_type === 'investor_info' && att.file_url.startsWith('investor:lead:')
        );
        if (leadInvestorInfo) {
          const leadName = leadInvestorInfo.file_url.replace('investor:lead:', '');
          form.setValue('lead_investor', leadName);
        }

        const otherInvestorInfo = attachments.find(att => 
          att.file_type === 'investor_info' && att.file_url.startsWith('investor:other:')
        );
        if (otherInvestorInfo) {
          const otherNames = otherInvestorInfo.file_url.replace('investor:other:', '');
          form.setValue('other_investors', otherNames);
        }
      }
    };

    if (deal.id) {
      fetchExistingData();
    }
  }, [deal.id, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DealEditFormHeader isUpdating={isUpdating} onCancel={onCancel} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DealEditCompanySection control={form.control} />
          <DealEditContactSection control={form.control} />
          <DealEditStatusSection control={form.control} />
          <DealEditFinancialSection control={form.control} />
          <DealEditNextStepsSection control={form.control} />
          <DealEditInvestorSection control={form.control} />
          <DealEditAttachmentsSection 
            control={form.control}
            dealId={deal.id}
            pitchDeckFile={pitchDeckFile}
            onFileChange={handleFileChange}
          />
          <DealTaskSection dealId={deal.id} />
        </div>
      </form>
    </Form>
  );
}
