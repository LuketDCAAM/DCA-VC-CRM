import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Save, X, Paperclip, Link } from 'lucide-react'; // Added Paperclip and Link icons
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
import { useEditDeal } from './hooks/useEditDeal'; // Import the new hook
import { supabase } from '@/integrations/supabase/client'; // Import supabase for fetching attachments

interface DealEditFormProps {
  deal: Deal;
  onSave: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return '';
  return (amount / 100).toString();
};

// Define a separate schema for the form values, including UI-specific fields
const dealFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required.'),
  website: z.string().url({ message: "Invalid URL." }).or(z.literal('')).nullable().optional(),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().email({ message: "Invalid email address." }).or(z.literal('')).nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  pipeline_stage: z.enum(Constants.public.Enums.pipeline_stage),
  round_stage: z.enum(Constants.public.Enums.round_stage).nullable().optional(),
  deal_score: z.number().min(0).max(100).nullable().optional(),
  deal_lead: z.string().nullable().optional(),
  deal_source: z.string().nullable().optional(),
  source_date: z.string().nullable().optional(),
  round_size: z.string().nullable().optional(), 
  post_money_valuation: z.string().nullable().optional(),
  revenue: z.string().nullable().optional(),
  pitch_deck_url: z.string().url({ message: "Invalid URL." }).or(z.literal('')).nullable().optional(), // New field for link
});

type DealFormValues = z.infer<typeof dealFormSchema> & {
  pitchDeckFile?: File | null; // Add file to form values type for convenience
};

export function DealEditForm({ deal, onSave, onCancel }: DealEditFormProps) {
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null); // State for the file input

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
      // Initialize new pitch deck URL field to an empty string, will be updated by useEffect
      pitch_deck_url: '', 
    },
  });

  // Use the new hook for submission logic
  const { handleEditSubmit, isUpdating } = useEditDeal({ deal, onSave });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0]);
    } else {
      setPitchDeckFile(null);
    }
  };

  const onSubmit = async (values: DealFormValues) => {
    await handleEditSubmit({ ...values, pitchDeckFile }); // Pass combined values including file
  };

  // Effect to populate pitch_deck_url if deal already has one (from file_attachments)
  React.useEffect(() => {
    const fetchExistingAttachments = async () => {
      const { data: attachments, error } = await supabase
        .from('file_attachments')
        .select('file_url')
        .eq('deal_id', deal.id)
        .eq('file_type', 'link') 
        .limit(1); // Assuming only one primary pitch deck link for form pre-population

      if (error) {
        console.error("Error fetching existing attachments for form pre-fill:", error);
        return;
      }

      if (attachments && attachments.length > 0) {
        form.setValue('pitch_deck_url', attachments[0].file_url);
      }
    };

    if (deal.id) { // Only fetch if deal ID is available
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
                  <FormMessage
                    