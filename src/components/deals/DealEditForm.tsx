
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';
import { Deal, PipelineStage, RoundStage } from '@/types/deal';
import { Form } from '@/components/ui/form';
import { DealCompanyForm } from './form/DealCompanyForm';
import { DealContactForm } from './form/DealContactForm';
import { DealStatusForm } from './form/DealStatusForm';
import { DealFinancialForm } from './form/DealFinancialForm';

interface DealEditFormProps {
  deal: Deal;
  onSave: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '';
  return (amount / 100).toString();
};

const parseCurrency = (value: string) => {
  if (value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : Math.round(num * 100);
};

const dealFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.'),
  website: z.string().url({ message: "Invalid URL." }).or(z.literal('')).nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  contact_name: z.string().nullable(),
  contact_email: z.string().email({ message: "Invalid email address." }).or(z.literal('')).nullable(),
  contact_phone: z.string().nullable(),
  pipeline_stage: z.nativeEnum(PipelineStage),
  round_stage: z.nativeEnum(RoundStage).nullable(),
  deal_score: z.number().min(0).max(100).nullable(),
  deal_lead: z.string().nullable(),
  deal_source: z.string().nullable(),
  source_date: z.string().nullable(),
  round_size: z.string().nullable().transform(val => parseCurrency(val || '')),
  post_money_valuation: z.string().nullable().transform(val => parseCurrency(val || '')),
  revenue: z.string().nullable().transform(val => parseCurrency(val || '')),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export function DealEditForm({ deal, onSave, onCancel }: DealEditFormProps) {
  const { toast } = useToast();
  
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      ...deal,
      contact_name: deal.contact_name || '',
      contact_email: deal.contact_email || '',
      contact_phone: deal.contact_phone || '',
      website: deal.website || '',
      location: deal.location || '',
      description: deal.description || '',
      round_stage: deal.round_stage,
      deal_score: deal.deal_score,
      source_date: deal.source_date ? deal.source_date.split('T')[0] : '',
      deal_source: deal.deal_source || '',
      deal_lead: deal.deal_lead || '',
      round_size: formatCurrency(deal.round_size),
      post_money_valuation: formatCurrency(deal.post_money_valuation),
      revenue: formatCurrency(deal.revenue),
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: DealFormValues) => {
    try {
      const updateData = {
        ...values,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal updated",
        description: "The deal has been successfully updated.",
      });

      onSave();
    } catch (error: any) {
      toast({
        title: "Error updating deal",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Deal</h3>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={onCancel} variant="outline" type="button">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DealCompanyForm />
          <DealContactForm />
          <DealStatusForm />
          <DealFinancialForm />
        </div>
      </form>
    </Form>
  );
}
