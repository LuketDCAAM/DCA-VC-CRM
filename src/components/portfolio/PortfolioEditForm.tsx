
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';
import { PortfolioCompany } from '@/hooks/usePortfolioCompanies';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface PortfolioEditFormProps {
  company: PortfolioCompany;
  onSave: () => void;
  onCancel: () => void;
}

const portfolioFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  description: z.string().nullable(),
  status: z.enum(['Active', 'Exited', 'Dissolved']),
  relationship_owner: z.string().nullable(),
  tags: z.string().nullable(),
});

type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

export function PortfolioEditForm({ company, onSave, onCancel }: PortfolioEditFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      company_name: company.company_name,
      description: company.description || '',
      status: company.status,
      relationship_owner: company.relationship_owner || '',
      tags: company.tags?.join('; ') || '',
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (values: PortfolioFormValues) => {
    try {
      const updateData = {
        company_name: values.company_name,
        description: values.description || null,
        status: values.status,
        relationship_owner: values.relationship_owner || null,
        tags: values.tags ? values.tags.split(';').map(tag => tag.trim()).filter(tag => tag) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('portfolio_companies')
        .update(updateData)
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Portfolio company updated",
        description: "The company details have been successfully updated.",
      });

      queryClient.invalidateQueries({ queryKey: ['portfolioCompanies'] });
      onSave();
    } catch (error: any) {
      toast({
        title: "Error updating company",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Edit Portfolio Company</h3>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={onCancel} variant="outline" type="button">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter company name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Exited">Exited</SelectItem>
                    <SelectItem value="Dissolved">Dissolved</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship_owner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship Owner</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Enter relationship owner" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} placeholder="Enter tags separated by semicolons" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ''} 
                  placeholder="Enter company description"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
