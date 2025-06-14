
import React from 'react';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Investor } from '@/types/investor';

interface PartialDeal {
  id: string;
  company_name: string;
}

interface PortfolioCompany {
  id: string;
  company_name: string;
}

export const contactFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  title: z.string().nullable(),
  company_or_firm: z.string().nullable(),
  email: z.string().email({ message: 'Invalid email address.' }).or(z.literal('')).nullable(),
  phone: z.string().nullable(),
  deal_id: z.string().nullable(),
  investor_id: z.string().nullable(),
  portfolio_company_id: z.string().nullable(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  deals: PartialDeal[];
  investors: Investor[];
  portfolioCompanies: PortfolioCompany[];
  preselectedDeal?: PartialDeal;
  preselectedInvestor?: Investor;
}

export function ContactForm({
  deals,
  investors,
  portfolioCompanies,
  preselectedDeal,
  preselectedInvestor,
}: ContactFormProps) {
  const { control, setValue } = useFormContext<ContactFormValues>();
  const associationDisabled = !!preselectedDeal || !!preselectedInvestor;

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input placeholder="Contact name" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Job title" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="company_or_firm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company/Firm</FormLabel>
            <FormControl>
              <Input placeholder="Company or firm name" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl>
              <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="deal_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Associated Deal</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                setValue('investor_id', '');
                setValue('portfolio_company_id', '');
              }}
              value={field.value || ''}
              disabled={associationDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a deal (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">No associated deal</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.company_name}
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
        name="investor_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Associated Investor</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setValue('deal_id', '');
                setValue('portfolio_company_id', '');
              }}
              value={field.value || ''}
              disabled={associationDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an investor (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">No associated investor</SelectItem>
                {investors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.contact_name}{' '}
                    {investor.firm_name && `(${investor.firm_name})`}
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
        name="portfolio_company_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Associated Portfolio Company</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setValue('deal_id', '');
                setValue('investor_id', '');
              }}
              value={field.value || ''}
              disabled={associationDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a portfolio company (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">No associated portfolio company</SelectItem>
                {portfolioCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.company_name}
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
