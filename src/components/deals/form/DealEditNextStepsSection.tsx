
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';
import { DealFormValues } from './dealEditFormSchema';

interface DealEditNextStepsSectionProps {
  control: Control<DealFormValues>;
}

export function DealEditNextStepsSection({ control }: DealEditNextStepsSectionProps) {
  return (
    <div className="md:col-span-2 space-y-4">
      <h4 className="font-medium">Next Steps</h4>
      <FormField
        control={control}
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
    </div>
  );
}
