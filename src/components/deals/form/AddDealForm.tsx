import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Constants } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddDeal } from '../hooks/useAddDeal';
import { Paperclip, FileText, Calendar, File, X, Upload } from 'lucide-react';
import { DuplicateDetectionDialog } from '../duplicates/DuplicateDetectionDialog';

const addDealFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  website: z.string().url({ message: "Invalid URL" }).or(z.literal('')).optional(),
  linkedin_url: z.string().url({ message: "Invalid URL" }).or(z.literal('')).optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email({ message: "Invalid email address" }).or(z.literal('')).optional(),
  contact_phone: z.string().optional(),
  pipeline_stage: z.string(),
  round_stage: z.string().nullable().optional(),
  investment_vehicle: z.string().nullable().optional(),
  deal_score: z.number().min(0).max(100).optional(),
  deal_lead: z.string().optional(),
  deal_source: z.string().optional(),
  source_date: z.string().optional(),
  round_size: z.string().optional(),
  post_money_valuation: z.string().optional(),
  revenue: z.string().optional(),
  pitch_deck_url: z.string().url({ message: "Invalid URL" }).or(z.literal('')).optional(),
  next_steps: z.string().optional(),
  last_call_date: z.string().optional(),
});

type AddDealFormValues = z.infer<typeof addDealFormSchema>;

interface AddDealValues {
  company_name: string;
  website?: string;
  linkedin_url?: string;
  city?: string;
  state_province?: string;
  country?: string;
  description?: string;
  sector?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  pipeline_stage: string;
  round_stage?: string;
  investment_vehicle?: string;
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
  additionalFiles?: File[];
}

interface AddDealFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function AddDealForm({ onSuccess, onCancel }: AddDealFormProps) {
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const { 
    handleAddSubmit, 
    isLoading, 
    pipelineStages, 
    roundStages,
    duplicates,
    showDuplicateDialog,
    pendingDealData,
    handleDuplicateDialogProceed,
    handleDuplicateDialogCancel,
  } = useAddDeal();

  const form = useForm<AddDealFormValues>({
    resolver: zodResolver(addDealFormSchema),
    defaultValues: {
      company_name: '',
      website: '',
      linkedin_url: '',
      city: '',
      state_province: '',
      country: '',
      description: '',
      sector: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      pipeline_stage: 'Inactive',
      round_stage: '',
      investment_vehicle: '',
      deal_score: undefined,
      deal_lead: '',
      deal_source: '',
      source_date: '',
      round_size: '',
      post_money_valuation: '',
      revenue: '',
      pitch_deck_url: '',
      next_steps: '',
      last_call_date: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeckFile(e.target.files[0]);
    } else {
      setPitchDeckFile(null);
    }
  };

  const handleAdditionalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAdditionalFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (values: AddDealFormValues) => {
    const submitValues: AddDealValues = {
      company_name: values.company_name, // Explicitly assign required field
      website: values.website,
      linkedin_url: values.linkedin_url,
      city: values.city,
      state_province: values.state_province,
      country: values.country,
      sector: values.sector,
      contact_name: values.contact_name,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone,
      pipeline_stage: values.pipeline_stage,
      round_stage: values.round_stage,
      investment_vehicle: values.investment_vehicle,
      deal_score: values.deal_score,
      deal_lead: values.deal_lead,
      deal_source: values.deal_source,
      source_date: values.source_date,
      round_size: values.round_size,
      post_money_valuation: values.post_money_valuation,
      revenue: values.revenue,
      pitch_deck_url: values.pitch_deck_url,
      next_steps: values.next_steps,
      last_call_date: values.last_call_date,
      pitchDeckFile,
      additionalFiles
    };
    
    const success = await handleAddSubmit(submitValues);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
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
                      <Input type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} placeholder="https://www.linkedin.com/company/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="San Francisco" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="California" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="USA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <FormField
                control={form.control}
                name="last_call_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last Call Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Deal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pipeline_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pipeline Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pipelineStages.map((stage) => (
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
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select round stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roundStages.map((stage) => (
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
                name="investment_vehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select investment vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Constants.public.Enums.investment_vehicle.map((vehicle) => (
                          <SelectItem key={vehicle} value={vehicle}>
                            {vehicle}
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
                    <FormLabel>Deal Score (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="Enter a score from 0 to 100"
                      />
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
                      <Input {...field} value={field.value || ''} placeholder="Name of the deal lead" />
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
                      <Input {...field} value={field.value || ''} placeholder="e.g. Referral, Conference, Cold Outreach" />
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
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="round_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round Size</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter round size" />
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
                    <FormLabel>Post Money Valuation</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter post money valuation" />
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
                    <FormLabel>Revenue</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter revenue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="next_steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Steps</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe the next steps for this deal..."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="pitch_deck_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pitch Deck URL</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} placeholder="Enter URL" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" /> Pitch Deck File
                </FormLabel>
                <FormControl>
                  <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileChange} />
                </FormControl>
                {pitchDeckFile && <p className="text-sm text-muted-foreground mt-1">Selected: {pitchDeckFile.name}</p>}
              </FormItem>

              {/* Other Attachments Section */}
              <div className="space-y-3 mt-6">
                <FormLabel className="flex items-center gap-1">
                  <File className="h-4 w-4" /> Other Attachments
                </FormLabel>
                
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                  onChange={handleAdditionalFileChange}
                />

                {/* Show selected files */}
                {additionalFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Selected files:</p>
                    {additionalFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Form>

    {/* Duplicate Detection Dialog */}
    <DuplicateDetectionDialog
      open={showDuplicateDialog}
      onOpenChange={() => {}}
      duplicates={duplicates}
      newDealData={{
        company_name: pendingDealData?.company_name || '',
        website: pendingDealData?.website,
        linkedin_url: pendingDealData?.linkedin_url,
        contact_email: pendingDealData?.contact_email,
        contact_name: pendingDealData?.contact_name,
      }}
      onProceed={async () => {
        const success = await handleDuplicateDialogProceed();
        if (success) {
          onSuccess();
        }
      }}
      onCancel={handleDuplicateDialogCancel}
    />
    </div>
  );
}
