import React, { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInvestors } from '@/hooks/useInvestors';
import { Investor } from '@/types/investor';

// Export investmentStages directly from here
export const investmentStages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage'] as const;

// Define the Zod schema
const investorSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_email: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  contact_phone: z.string().nullable().optional(),
  firm_name: z.string().nullable().optional(),
  firm_website: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  linkedin_url: z.string().url('Invalid LinkedIn URL').nullable().optional().or(z.literal('')),
  location: z.string().nullable().optional(),
  preferred_investment_stage: z.enum(investmentStages).nullable().optional(),
  average_check_size: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? null : Number(val),
    z.number().positive().nullable().optional()
  ),
  preferred_sectors: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  last_call_date: z.string().nullable().optional(),
});

// Export InvestorFormData type for use in other components
export type InvestorFormData = z.infer<typeof investorSchema>;

interface AddInvestorDialogProps {
  investor?: Investor;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFormData?: InvestorFormData;
  onCloseWithoutSave?: (formData: InvestorFormData) => void;
}

export function AddInvestorDialog({ investor, onSuccess, open, onOpenChange, initialFormData, onCloseWithoutSave }: AddInvestorDialogProps) {
  const { addInvestor, updateInvestor } = useInvestors();
  const hasInitializedRef = useRef(false);
  const getDraftKey = () => (investor ? `investorEditFormDraft_${investor.id}` : 'investorAddFormDraft');
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
  });

  // Only reset form when dialog opens for the first time or when switching between add/edit modes
  useEffect(() => {
    if (open && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      if (investor) {
        // Editing existing investor: populate with investor data
        reset({
          ...investor,
          preferred_sectors: investor.preferred_sectors?.join('; ') || '',
          tags: investor.tags?.join('; ') || '',
          average_check_size: investor.average_check_size ? investor.average_check_size / 100 : undefined,
          last_call_date: investor.last_call_date || '',
        });
      } else {
        // Adding new investor: populate with initialFormData (draft) or blank
        reset({
          contact_name: initialFormData?.contact_name || '',
          contact_email: initialFormData?.contact_email || '',
          contact_phone: initialFormData?.contact_phone || '',
          firm_name: initialFormData?.firm_name || '',
          firm_website: initialFormData?.firm_website || '',
          linkedin_url: initialFormData?.linkedin_url || '',
          location: initialFormData?.location || '',
          preferred_investment_stage: initialFormData?.preferred_investment_stage || null,
          average_check_size: initialFormData?.average_check_size || undefined,
          preferred_sectors: initialFormData?.preferred_sectors || '',
          tags: initialFormData?.tags || '',
          last_call_date: initialFormData?.last_call_date || '',
        });
      }

      // If there's a saved draft, load it last (it overrides the above)
      try {
        const draftRaw = localStorage.getItem(getDraftKey());
        if (draftRaw) {
          const draft = JSON.parse(draftRaw) as InvestorFormData;
          reset(draft);
        }
      } catch (e) {
        console.error('Failed to parse investor draft from localStorage', e);
      }
    }
    
    // Reset the ref when dialog closes
    if (!open) {
      hasInitializedRef.current = false;
    }
  }, [open, investor, initialFormData, reset]);

  // Autosave draft to localStorage while typing
  useEffect(() => {
    if (!open) return;
    const subscription = watch((value) => {
      try {
        localStorage.setItem(getDraftKey(), JSON.stringify(value));
      } catch {}
    });
    return () => {
      // @ts-ignore - unsubscribe may not exist in older RHF versions
      subscription?.unsubscribe?.();
    };
  }, [open, watch, investor]);

  // Persist draft when tab loses visibility (switching tabs/windows)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden' && open) {
        try {
          localStorage.setItem(getDraftKey(), JSON.stringify(getValues()));
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [open, getValues, investor]);

  const handleDialogClose = (newOpenState: boolean) => {
    if (!newOpenState && !investor) {
      const current = getValues();
      try {
        localStorage.setItem(getDraftKey(), JSON.stringify(current));
      } catch {}
      if (onCloseWithoutSave) {
        onCloseWithoutSave(current);
      }
    }
    onOpenChange(newOpenState);
  };
  
  const onSubmit = async (data: InvestorFormData) => {
    const investorData = {
        ...data,
        preferred_sectors: data.preferred_sectors?.split(';').map(s => s.trim()).filter(Boolean) || null,
        tags: data.tags?.split(';').map(t => t.trim()).filter(Boolean) || null,
        average_check_size: data.average_check_size ? data.average_check_size * 100 : null,
        last_call_date: data.last_call_date || null,
    };

    try {
      if (investor) {
        await updateInvestor(investor.id, investorData);
      } else {
        await addInvestor(investorData as any);
      }
      onSuccess();
      try { localStorage.removeItem(getDraftKey()); } catch {}
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save investor', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{investor ? 'Edit Investor' : 'Add Investor'}</DialogTitle>
          <DialogDescription>
            {investor ? 'Update the details of this investor.' : 'Add a new investor to your list.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact_name" className="text-right">Name*</Label>
            <Input id="contact_name" {...register('contact_name')} className="col-span-3" />
            {errors.contact_name && <p className="col-start-2 col-span-3 text-red-500 text-sm">{errors.contact_name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact_email" className="text-right">Email</Label>
            <Input id="contact_email" {...register('contact_email')} className="col-span-3" />
            {errors.contact_email && <p className="col-start-2 col-span-3 text-red-500 text-sm">{errors.contact_email.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact_phone" className="text-right">Phone</Label>
            <Input id="contact_phone" {...register('contact_phone')} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firm_name" className="text-right">Firm</Label>
            <Input id="firm_name" {...register('firm_name')} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firm_website" className="text-right">Website</Label>
            <Input id="firm_website" {...register('firm_website')} className="col-span-3" />
            {errors.firm_website && <p className="col-start-2 col-span-3 text-red-500 text-sm">{errors.firm_website.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkedin_url" className="text-right">LinkedIn</Label>
            <Input id="linkedin_url" {...register('linkedin_url')} className="col-span-3" placeholder="https://linkedin.com/in/..." />
            {errors.linkedin_url && <p className="col-start-2 col-span-3 text-red-500 text-sm">{errors.linkedin_url.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">Location</Label>
            <Input id="location" {...register('location')} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preferred_investment_stage" className="text-right">Stage</Label>
            <Controller
              control={control}
              name="preferred_investment_stage"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentStages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="average_check_size" className="text-right">Avg. Check ($)</Label>
            <Input id="average_check_size" type="number" {...register('average_check_size')} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="preferred_sectors" className="text-right">Sectors</Label>
            <Input id="preferred_sectors" {...register('preferred_sectors')} className="col-span-3" placeholder="Semicolon-separated" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">Tags</Label>
            <Input id="tags" {...register('tags')} className="col-span-3" placeholder="Semicolon-separated" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="last_call_date" className="text-right">Last Call Date</Label>
            <Input id="last_call_date" type="date" {...register('last_call_date')} className="col-span-3" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
