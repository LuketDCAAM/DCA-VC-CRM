
import React, { useEffect } from 'react';
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

const investmentStages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'] as const;

const investorSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_email: z.string().email('Invalid email address').nullable().optional().or(z.literal('')),
  contact_phone: z.string().nullable().optional(),
  firm_name: z.string().nullable().optional(),
  firm_website: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
  location: z.string().nullable().optional(),
  preferred_investment_stage: z.enum(investmentStages).nullable().optional(),
  average_check_size: z.coerce.number().positive().nullable().optional(),
  preferred_sectors: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
});

type InvestorFormData = z.infer<typeof investorSchema>;

interface AddInvestorDialogProps {
  investor?: any;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddInvestorDialog({ investor, onSuccess, open, onOpenChange }: AddInvestorDialogProps) {
  const { addInvestor, updateInvestor } = useInvestors();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InvestorFormData>({
    resolver: zodResolver(investorSchema),
  });

  useEffect(() => {
    if (open) {
      if (investor) {
        reset({
          ...investor,
          preferred_sectors: investor.preferred_sectors?.join('; ') || '',
          tags: investor.tags?.join('; ') || '',
          average_check_size: investor.average_check_size ? investor.average_check_size / 100 : undefined
        });
      } else {
        reset({
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          firm_name: '',
          firm_website: '',
          location: '',
          preferred_investment_stage: null,
          average_check_size: undefined,
          preferred_sectors: '',
          tags: '',
        });
      }
    }
  }, [investor, open, reset]);
  
  const onSubmit = async (data: InvestorFormData) => {
    const investorData = {
        ...data,
        preferred_sectors: data.preferred_sectors?.split(';').map(s => s.trim()).filter(Boolean) || null,
        tags: data.tags?.split(';').map(t => t.trim()).filter(Boolean) || null,
        average_check_size: data.average_check_size ? data.average_check_size * 100 : null,
    };

    try {
      if (investor) {
        await updateInvestor(investor.id, investorData);
      } else {
        await addInvestor(investorData as any);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save investor', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
