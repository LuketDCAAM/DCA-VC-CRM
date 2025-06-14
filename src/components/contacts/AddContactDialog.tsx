
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/useDeals';
import { useInvestors } from '@/hooks/useInvestors';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { type Investor } from '@/types/investor';
import { ContactForm, contactFormSchema, type ContactFormValues } from './ContactForm';
import { Form } from '@/components/ui/form';

interface PartialDeal {
  id: string;
  company_name: string;
}

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company_or_firm: string | null;
  email: string | null;
  phone: string | null;
  deal_id: string | null;
  investor_id: string | null;
  portfolio_company_id: string | null;
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
}

interface AddContactDialogProps {
  contact?: Contact;
  onContactSaved?: () => void;
  trigger?: React.ReactNode;
  preselectedInvestor?: Investor;
  preselectedDeal?: PartialDeal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddContactDialog({ 
  contact, 
  onContactSaved, 
  trigger, 
  preselectedInvestor, 
  preselectedDeal, 
  open: controlledOpen, 
  onOpenChange: setControlledOpen 
}: AddContactDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const [loading, setLoading] = useState(false);
  
  const { addContact, updateContact } = useContacts();
  const { deals } = useDeals();
  const { investors } = useInvestors();
  const { companies: portfolioCompanies } = usePortfolioCompanies();

  const defaultValues = useMemo(() => {
    if (contact) {
      return {
        name: contact.name || '',
        title: contact.title || '',
        company_or_firm: contact.company_or_firm || '',
        email: contact.email || '',
        phone: contact.phone || '',
        deal_id: contact.deal_id || '',
        investor_id: contact.investor_id || '',
        portfolio_company_id: contact.portfolio_company_id || '',
      };
    } 
    if (preselectedInvestor) {
      return {
        name: '',
        title: '',
        company_or_firm: preselectedInvestor.firm_name || '',
        email: '',
        phone: '',
        deal_id: '',
        investor_id: preselectedInvestor.id,
        portfolio_company_id: '',
      };
    } 
    if (preselectedDeal) {
      return {
        name: '',
        title: '',
        company_or_firm: preselectedDeal.company_name || '',
        email: '',
        phone: '',
        deal_id: preselectedDeal.id,
        investor_id: '',
        portfolio_company_id: '',
      };
    }
    return {
        name: '',
        title: '',
        company_or_firm: '',
        email: '',
        phone: '',
        deal_id: '',
        investor_id: '',
        portfolio_company_id: '',
      };
  }, [contact, preselectedInvestor, preselectedDeal]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    try {
      const contactData = {
        name: values.name,
        title: values.title || null,
        company_or_firm: values.company_or_firm || null,
        email: values.email || null,
        phone: values.phone || null,
        deal_id: values.deal_id || null,
        investor_id: values.investor_id || null,
        portfolio_company_id: values.portfolio_company_id || null,
        relationship_owner: null,
      };

      if (contact) {
        await updateContact(contact.id, contactData);
      } else {
        await addContact(contactData);
      }

      setOpen(false);
      onContactSaved?.();
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            {contact ? 'Update contact information.' : 'Add a new contact to your directory.'}
          </DialogDescription>
        </DialogHeader>

        {preselectedInvestor && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            Associating with investor:{' '}
            <span className="font-semibold">{preselectedInvestor.contact_name}{' '}
            {preselectedInvestor.firm_name && `(${preselectedInvestor.firm_name})`}</span>
          </div>
        )}

        {preselectedDeal && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            Associating with deal:{' '}
            <span className="font-semibold">{preselectedDeal.company_name}</span>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} id="contact-form">
            <ContactForm 
              deals={deals}
              investors={investors}
              portfolioCompanies={portfolioCompanies}
              preselectedDeal={preselectedDeal}
              preselectedInvestor={preselectedInvestor}
            />
          </form>
        </Form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="contact-form" disabled={loading}>
            {loading ? 'Saving...' : (contact ? 'Update Contact' : 'Add Contact')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
