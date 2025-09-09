
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Constants } from '@/integrations/supabase/types';

export function DealFinancialForm() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="round_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Round Size ($)</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value || ''} placeholder="1000000" />
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
              <FormLabel>Post-Money Valuation ($)</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value || ''} placeholder="10000000" />
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
              <FormLabel>Revenue ($)</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value || ''} placeholder="500000" />
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
      </CardContent>
    </Card>
  );
}
