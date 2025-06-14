
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/useDeals';
import { useInvestors } from '@/hooks/useInvestors';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { type Investor } from '@/types/investor';

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddContactDialog({ contact, onContactSaved, trigger, preselectedInvestor, open: controlledOpen, onOpenChange: setControlledOpen }: AddContactDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen! : setUncontrolledOpen;

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company_or_firm: '',
    email: '',
    phone: '',
    deal_id: '',
    investor_id: '',
    portfolio_company_id: '',
  });
  const [loading, setLoading] = useState(false);
  
  const { addContact, updateContact } = useContacts();
  const { deals } = useDeals();
  const { investors } = useInvestors();
  const { companies: portfolioCompanies } = usePortfolioCompanies();

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        title: contact.title || '',
        company_or_firm: contact.company_or_firm || '',
        email: contact.email || '',
        phone: contact.phone || '',
        deal_id: contact.deal_id || '',
        investor_id: contact.investor_id || '',
        portfolio_company_id: contact.portfolio_company_id || '',
      });
    } else if (preselectedInvestor) {
      setFormData({
        name: '',
        title: '',
        company_or_firm: preselectedInvestor.firm_name || '',
        email: '',
        phone: '',
        deal_id: '',
        investor_id: preselectedInvestor.id,
        portfolio_company_id: '',
      });
    } else {
      setFormData({
        name: '',
        title: '',
        company_or_firm: '',
        email: '',
        phone: '',
        deal_id: '',
        investor_id: '',
        portfolio_company_id: '',
      });
    }
  }, [contact, open, preselectedInvestor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const contactData = {
        name: formData.name,
        title: formData.title || null,
        company_or_firm: formData.company_or_firm || null,
        email: formData.email || null,
        phone: formData.phone || null,
        deal_id: formData.deal_id || null,
        investor_id: formData.investor_id || null,
        portfolio_company_id: formData.portfolio_company_id || null,
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
          <DialogTitle>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </DialogTitle>
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Contact name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Job title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company/Firm</Label>
            <Input
              id="company"
              value={formData.company_or_firm}
              onChange={(e) => setFormData(prev => ({ ...prev, company_or_firm: e.target.value }))}
              placeholder="Company or firm name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal">Associated Deal</Label>
            <Select 
              value={formData.deal_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, deal_id: value, investor_id: '', portfolio_company_id: '' }))}
              disabled={!!preselectedInvestor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a deal (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No associated deal</SelectItem>
                {deals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="investor">Associated Investor</Label>
            <Select
              value={formData.investor_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, investor_id: value, deal_id: '', portfolio_company_id: '' }))}
              disabled={!!preselectedInvestor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an investor (optional)" />
              </SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio_company">Associated Portfolio Company</Label>
            <Select
              value={formData.portfolio_company_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, portfolio_company_id: value, deal_id: '', investor_id: '' }))}
              disabled={!!preselectedInvestor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a portfolio company (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No associated portfolio company</SelectItem>
                {portfolioCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (contact ? 'Update Contact' : 'Add Contact')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
