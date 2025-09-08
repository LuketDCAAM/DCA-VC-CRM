
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddDeal } from '../hooks/useAddDeal';

export function DealStatusForm() {
  const { control } = useFormContext();
  const { pipelineStages, roundStages } = useAddDeal();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="pipeline_stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pipeline Stage</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
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
          control={control}
          name="round_stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Round Stage</FormLabel>
              <Select onValueChange={(v) => field.onChange(v === '' ? undefined : v)} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select round stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
  );
}
