
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { DealCompanyForm } from './DealCompanyForm';
import { DealContactForm } from './DealContactForm';
import { DealStatusForm } from './DealStatusForm';
import { DealFinancialForm } from './DealFinancialForm';
import { useAddDeal, type AddDealFormData, defaultFormData } from '../hooks/useAddDeal';

interface AddDealFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddDealForm({ onSuccess, onCancel }: AddDealFormProps) {
  const { loading, createDeal } = useAddDeal();
  
  const form = useForm<AddDealFormData>({
    defaultValues: defaultFormData,
  });

  const handleSubmit = (data: AddDealFormData) => {
    createDeal(data, () => {
      form.reset();
      onSuccess();
    });
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6">
          <DealCompanyForm />
          <DealContactForm />
          <DealStatusForm />
          <DealFinancialForm />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Deal'}
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}
