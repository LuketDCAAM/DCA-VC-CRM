
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface CurrentValuation {
  last_round_post_money_valuation: number | null;
  last_round_price_per_share: number | null;
  current_ownership_percentage: number | null;
}

interface PerformanceEditFormProps {
  companyId: string;
  currentValuation: CurrentValuation | null;
  onSave: () => void;
  onCancel: () => void;
}

const performanceSchema = z.object({
  last_round_post_money_valuation: z.number().nullable(),
  last_round_price_per_share: z.number().nullable(),
  current_ownership_percentage: z.number().min(0).max(1).nullable(),
});

type PerformanceFormValues = z.infer<typeof performanceSchema>;

export function PerformanceEditForm({ companyId, currentValuation, onSave, onCancel }: PerformanceEditFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceSchema),
    defaultValues: {
      last_round_post_money_valuation: currentValuation?.last_round_post_money_valuation ? currentValuation.last_round_post_money_valuation / 100 : null,
      last_round_price_per_share: currentValuation?.last_round_price_per_share ? currentValuation.last_round_price_per_share / 100 : null,
      current_ownership_percentage: currentValuation?.current_ownership_percentage || null,
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: PerformanceFormValues) => {
    try {
      const valuationData = {
        portfolio_company_id: companyId,
        last_round_post_money_valuation: values.last_round_post_money_valuation ? values.last_round_post_money_valuation * 100 : null,
        last_round_price_per_share: values.last_round_price_per_share ? values.last_round_price_per_share * 100 : null,
        current_ownership_percentage: values.current_ownership_percentage,
        updated_at: new Date().toISOString(),
      };

      // Upsert current valuation
      const { error } = await supabase
        .from('current_valuations')
        .upsert(valuationData, { 
          onConflict: 'portfolio_company_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Performance data updated",
        description: "Current valuation and performance metrics have been successfully updated.",
      });

      queryClient.invalidateQueries({ queryKey: ['portfolioCompanies'] });
      onSave();
    } catch (error: any) {
      toast({
        title: "Error updating performance data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Edit Performance Data</h3>
        <div className="flex gap-2">
          <Button type="submit" form="performance-form" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="performance-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Valuation Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="last_round_post_money_valuation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Round Post-Money Valuation</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          placeholder="Enter valuation amount"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_round_price_per_share"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Round Price per Share</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="Enter price per share"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_ownership_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Ownership Percentage</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          step="0.01"
                          max="100"
                          placeholder="Enter ownership percentage"
                          value={field.value ? (field.value * 100).toFixed(2) : ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) / 100 : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
