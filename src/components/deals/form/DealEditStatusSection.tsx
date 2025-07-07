import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Control } from 'react-hook-form';
import { Constants } from '@/integrations/supabase/types';
import { DealFormValues } from './dealEditFormSchema';

interface DealEditStatusSectionProps {
  control: Control<DealFormValues>;
}

export function DealEditStatusSection({ control }: DealEditStatusSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Deal Status</h4>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
        name="deal_score"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Deal Score</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                {...field} 
                value={field.value === null || field.value === undefined ? '' : field.value} 
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
  );
}
