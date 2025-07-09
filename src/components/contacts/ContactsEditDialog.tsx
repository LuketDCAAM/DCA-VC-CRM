
import React from 'react';
import { Contact } from '@/types/contact';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';

interface ContactsEditDialogProps {
  selectedContact: Contact | null;
  editDialogOpen: boolean;
  onContactSaved: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ContactsEditDialog({
  selectedContact,
  editDialogOpen,
  onContactSaved,
  onOpenChange
}: ContactsEditDialogProps) {
  if (!selectedContact) {
    return null;
  }

  return (
    <AddContactDialog
      open={editDialogOpen}
      onOpenChange={onOpenChange}
      contact={selectedContact}
      onContactSaved={onContactSaved}
    />
  );
}
