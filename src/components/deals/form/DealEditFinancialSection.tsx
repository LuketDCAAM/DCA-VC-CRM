
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Control } from 'react-hook-form';
import { DealFormValues } from './dealEditFormSchema';
import { Constants } from '@/integrations/supabase/types';

interface DealEditFinancialSectionProps {
  control: Control<DealFormValues>;
}

export function DealEditFinancialSection({ control }: DealEditFinancialSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Financial Information</h4>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
      <FormField
        control={control}
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
    </div>
  );
}
