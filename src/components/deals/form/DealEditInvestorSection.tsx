
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';
import { Control } from 'react-hook-form';
import { DealFormValues } from './dealEditFormSchema';

interface DealEditInvestorSectionProps {
  control: Control<DealFormValues>;
}

export function DealEditInvestorSection({ control }: DealEditInvestorSectionProps) {
  return (
    <div className="md:col-span-2 space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Users className="h-4 w-4" /> Investor Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="lead_investor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Investor</FormLabel>
              <FormControl>
                <Input placeholder="Primary investor name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="other_investors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Other Investors</FormLabel>
              <FormControl>
                <Input placeholder="Additional investors (comma-separated)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
