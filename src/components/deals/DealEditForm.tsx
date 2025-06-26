import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Save, X, Paperclip, Link } from 'lucide-react';
import { Deal } from '@/types/deal'; 
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'; 
import { Input } from '@/components/ui/input'; 
import { Textarea } from '@/components/ui/textarea'; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Constants } from '@/integrations/supabase/types';
import { useEditDeal } from './hooks/useEditDeal';
import { supabase } from '@/integrations/supabase/client';

interface DealEditFormProps {
  deal: Deal;
  onSave: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '';
  return (amount / 100).toString();
};

const dealFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.'),
  website: z.string().url({ message: "Invalid URL." }).or(z.literal('')).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email({ message: "Invalid email address." }).or(z.literal('')).optional(),
  contact_phone: z.string().optional(),
  pipeline_stage: z.enum(Constants.public.Enums.pipeline_stage),
  round_stage: z.enum(Constants.public.Enums.round_stage).optional(),
  deal_score: z.number().min(0).max(100).optional(),
  deal_lead: z.string().optional(),
  deal_source: z.string().optional(),
  source_date: z.string().optional(),
  round_size: z.string().optional(), 
  post_money_valuation: z.string().optional(),
  revenue: z.string().optional(),
  pitch_deck_url: z.string().url({ message: "Invalid URL." }).or(z.literal('')).optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema> & {
  pitchDeckFile?: File | null;
};

export function DealEditForm({ deal, onSave, onCancel }: DealEditFormProps) {
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);

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
      sector: deal.sector || '',
      round_stage: deal.round_stage, 
      deal_score: deal.deal_score,
      source_date: deal.source_date ? deal.source_date.split('T')[0] : '', 
      deal_source: deal.deal_source || '',
      deal_lead: deal.deal_lead || '',
      round_size: formatCurrency(deal.round_size),
      post_money_valuation: formatCurrency(deal.post_money_valuation),
      revenue: formatCurrency(deal.revenue),
      pitch_deck_url: '', 
    },
  });

  const { handleEditSubmit, isUpdating } = useEditDeal({ deal, onSave });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0]);
    } else {
      setPitchDeckFile(null);
    }
  };

  const onSubmit = async (values: DealFormValues) => {
    const submitValues = {
      ...values,
      website: values.website || '',
      location: values.location || '',
      description: values.description || '',
      sector: values.sector || '',
      contact_name: values.contact_name || '',
      contact_email: values.contact_email || '',
      contact_phone: values.contact_phone || '',
      deal_lead: values.deal_lead || '',
      deal_source: values.deal_source || '',
      source_date: values.source_date || '',
      round_size: values.round_size || '',
      post_money_valuation: values.post_money_valuation || '',
      revenue: values.revenue || '',
      pitch_deck_url: values.pitch_deck_url || '',
      pitchDeckFile
    };
    await handleEditSubmit(submitValues);
  };

  React.useEffect(() => {
    const fetchExistingAttachments = async () => {
      const { data: attachments, error } = await supabase
        .from('file_attachments')
        .select('file_url')
        .eq('deal_id', deal.id)
        .eq('file_type', 'link') 
        .limit(1);

      if (error) {
        console.error("Error fetching existing attachments for form pre-fill:", error);
        return;
      }

      if (attachments && attachments.length > 0) {
        form.setValue('pitch_deck_url', attachments[0].file_url);
      }
    };

    if (deal.id) {
      fetchExistingAttachments();
    }
  }, [deal.id, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Deal</h3>
          <div className="flex gap-2">
            <Button type="submit" disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={onCancel} variant="outline" type="button">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Company Details</h4>
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Deal Status</h4>
            <FormField
              control={form.control}
              name="pipeline_stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pipeline Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pipeline stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Constants.public.Enums.pipeline_stage.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="round_stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Round Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select round stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Constants.public.Enums.round_stage.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deal_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Score</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value === null ? '' : field.value} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deal_lead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Lead</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deal_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Source</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Financial Information</h4>
            <FormField
              control={form.control}
              name="round_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Round Size (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="post_money_valuation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post-Money Valuation (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="revenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revenue (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Attachments */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-medium">Attachments & Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" /> Pitch Deck File
                </FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileChange} />
                </FormControl>
                {pitchDeckFile && <p className="text-sm text-muted-foreground mt-1">Selected: {pitchDeckFile.name}</p>}
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="pitch_deck_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Link className="h-4 w-4" /> Pitch Deck Link
                    </FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://docs.google.com/presentation/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
