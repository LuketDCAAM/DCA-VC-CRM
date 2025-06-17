
import React from 'react';
import { ContactCard } from '@/components/contacts/ContactCard';
import { Contact } from '@/types/contact';

interface ContactsGridProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string, selected: boolean) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
}

export function ContactsGrid({ 
  contacts, 
  selectedContacts, 
  onSelectContact, 
  onEditContact, 
  onDeleteContact 
}: ContactsGridProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No contacts match your search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onEdit={onEditContact}
          onDelete={onDeleteContact}
        />
      ))}
    </div>
  );
}
