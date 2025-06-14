
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DealStatusForm() {
  const { control } = useFormContext();

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
                  <SelectItem value="Seen Not Reviewed">Seen Not Reviewed</SelectItem>
                  <SelectItem value="Initial Review">Initial Review</SelectItem>
                  <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                  <SelectItem value="First Meeting">First Meeting</SelectItem>
                  <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                  <SelectItem value="Term Sheet">Term Sheet</SelectItem>
                  <SelectItem value="Legal Review">Legal Review</SelectItem>
                  <SelectItem value="Invested">Invested</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
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
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select round stage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pre-Seed">Pre-Seed</SelectItem>
                  <SelectItem value="Seed">Seed</SelectItem>
                  <SelectItem value="Series A">Series A</SelectItem>
                  <SelectItem value="Series B">Series B</SelectItem>
                  <SelectItem value="Series C">Series C</SelectItem>
                  <SelectItem value="Bridge">Bridge</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
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
