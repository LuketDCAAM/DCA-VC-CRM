
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Deal } from '@/types/deal';
import { dealFormSchema, DealFormValues } from './dealEditFormSchema';

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '';
  return (amount / 100).toString();
};

interface UseDealEditFormProps {
  deal: Deal;
}

export function useDealEditForm({ deal }: UseDealEditFormProps) {
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      company_name: deal.company_name,
      contact_name: deal.contact_name || '',
      contact_email: deal.contact_email || '',
      contact_phone: deal.contact_phone || '',
      website: deal.website || '',
      location: deal.location || '',
      description: deal.description || '',
      sector: deal.sector || '',
      pipeline_stage: deal.pipeline_stage, // This should be required and not optional
      round_stage: deal.round_stage, 
      deal_score: deal.deal_score || undefined,
      source_date: deal.source_date ? deal.source_date.split('T')[0] : '', 
      deal_source: deal.deal_source || '',
      deal_lead: deal.deal_lead || '',
      round_size: formatCurrency(deal.round_size),
      post_money_valuation: formatCurrency(deal.post_money_valuation),
      revenue: formatCurrency(deal.revenue),
      pitch_deck_url: '', 
      lead_investor: '',
      other_investors: '',
      next_steps: deal.next_steps || '',
      last_call_date: deal.last_call_date ? deal.last_call_date.split('T')[0] : '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0]);
    } else {
      setPitchDeckFile(null);
    }
  };

  return {
    form,
    pitchDeckFile,
    handleFileChange,
  };
}
