
import React from 'react';
import { Contact } from '@/types/contact';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';

interface ContactsEditDialogProps {
  selectedContact: Contact | null;
  editDialogOpen: boolean;
  onContactSaved: () => void;
}

export function ContactsEditDialog({
  selectedContact,
  editDialogOpen,
  onContactSaved
}: ContactsEditDialogProps) {
  if (!selectedContact || !editDialogOpen) {
    return null;
  }

  return (
    <AddContactDialog
      contact={selectedContact}
      onContactSaved={onContactSaved}
      trigger={<div />}
    />
  );
}
