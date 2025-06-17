
import React, { useState } from 'react';
import { Contact } from '@/types/contact';
import { ContactsHeader } from '@/components/contacts/ContactsHeader';
import { ContactsStats } from '@/components/contacts/ContactsStats';
import { ContactsEmptyState } from '@/components/contacts/ContactsEmptyState';
import { ContactsWithFilters } from '@/components/contacts/ContactsWithFilters';

interface ContactsMainContentProps {
  contacts: Contact[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => Promise<void>;
  onDeleteMultipleContacts: (ids: string[]) => Promise<void>;
  onContactSaved: () => void;
}

export function ContactsMainContent({
  contacts,
  onEditContact,
  onDeleteContact,
  onDeleteMultipleContacts,
  onContactSaved
}: ContactsMainContentProps) {
  // Prepare export data with calculated fields
  const exportData = contacts.map(contact => ({
    ...contact,
    contact_type: contact.deal_id ? 'Deal Contact' : 
                  contact.investor_id ? 'Investor Contact' : 
                  contact.portfolio_company_id ? 'Portfolio Contact' : 'General Contact',
  }));

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await onDeleteContact(contactId);
    }
  };

  return (
    <>
      <ContactsHeader 
        exportData={exportData}
        loading={false}
        onContactSaved={onContactSaved}
      />

      {contacts.length === 0 ? (
        <ContactsEmptyState onContactSaved={onContactSaved} />
      ) : (
        <div className="space-y-6">
          <ContactsStats contacts={contacts} />
          
          <ContactsWithFilters
            contacts={contacts}
            onEditContact={onEditContact}
            onDeleteContact={handleDeleteContact}
            onDeleteMultipleContacts={onDeleteMultipleContacts}
          />
        </div>
      )}
    </>
  );
}
