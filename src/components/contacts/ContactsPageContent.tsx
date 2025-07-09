
import React, { useState } from 'react';
import { Contact } from '@/types/contact';
import { ContactsLoadingState } from '@/components/contacts/ContactsLoadingState';
import { ContactsMainContent } from '@/components/contacts/ContactsMainContent';
import { ContactsEditDialog } from '@/components/contacts/ContactsEditDialog';

interface ContactsPageContentProps {
  contacts: Contact[];
  loading: boolean;
  deleteContact: (contactId: string) => Promise<void>;
  deleteMultipleContacts: (ids: string[]) => Promise<void>;
  refetch: () => Promise<void>;
}

export function ContactsPageContent({
  contacts,
  loading,
  deleteContact,
  deleteMultipleContacts,
  refetch
}: ContactsPageContentProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditDialogOpen(true);
  };

  const handleContactSaved = () => {
    setEditDialogOpen(false);
    setSelectedContact(null);
    refetch();
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setSelectedContact(null);
    }
  };

  if (loading) {
    return <ContactsLoadingState onContactSaved={refetch} />;
  }

  return (
    <div className="p-6">
      <ContactsMainContent
        contacts={contacts}
        onEditContact={handleEditContact}
        onDeleteContact={deleteContact}
        onDeleteMultipleContacts={deleteMultipleContacts}
        onContactSaved={refetch}
      />

      <ContactsEditDialog
        selectedContact={selectedContact}
        editDialogOpen={editDialogOpen}
        onContactSaved={handleContactSaved}
        onOpenChange={handleEditDialogOpenChange}
      />
    </div>
  );
}
