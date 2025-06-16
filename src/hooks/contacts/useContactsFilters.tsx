
import { useState, useMemo } from 'react';
import { Contact } from '@/types/contact';

export function useContactsFilters(contacts: Contact[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company_or_firm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Active filters
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value || value === 'all' || value === '') return true;
        
        if (key === 'contact_type') {
          if (value === 'deal') return contact.deal_id !== null;
          if (value === 'investor') return contact.investor_id !== null;
          if (value === 'portfolio') return contact.portfolio_company_id !== null;
          if (value === 'general') return !contact.deal_id && !contact.investor_id && !contact.portfolio_company_id;
        }
        
        if (key === 'has_email') {
          return value === 'yes' ? contact.email !== null : contact.email === null;
        }
        
        if (key === 'has_phone') {
          return value === 'yes' ? contact.phone !== null : contact.phone === null;
        }
        
        if (key === 'created_at') {
          const contactDate = new Date(contact.created_at).toISOString().split('T')[0];
          return contactDate >= value;
        }
        
        return true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [contacts, searchTerm, activeFilters]);

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    filteredContacts,
    handleFilterChange,
    handleClearFilters
  };
}
