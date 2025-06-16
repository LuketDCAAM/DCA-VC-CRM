
import React from 'react';
import { ContactsPageContent } from '@/components/contacts/ContactsPageContent';
import { useContacts } from '@/hooks/useContacts';

export default function Contacts() {
  const contactsData = useContacts();

  return <ContactsPageContent {...contactsData} />;
}
