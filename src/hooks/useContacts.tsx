
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Contact } from '@/types/contact';
import { useContactsAPI } from '@/hooks/contacts/useContactsAPI';
import { useContactsSubscription } from '@/hooks/contacts/useContactsSubscription';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const {
    fetchContacts,
    addContact: apiAddContact,
    updateContact: apiUpdateContact,
    deleteContact: apiDeleteContact,
    deleteMultipleContacts: apiDeleteMultipleContacts,
  } = useContactsAPI(user);

  const refetchContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await fetchContacts();
      setContacts(data);
    } finally {
      setLoading(false);
    }
  };

  // Set up realtime subscription
  useContactsSubscription(user, refetchContacts);

  const addContact = async (contactData: Parameters<typeof apiAddContact>[0]) => {
    const newContact = await apiAddContact(contactData);
    if (newContact) {
      setContacts(prev => [newContact, ...prev]);
    }
    return newContact;
  };

  const updateContact = async (id: string, updates: Parameters<typeof apiUpdateContact>[1]) => {
    const updatedContact = await apiUpdateContact(id, updates);
    if (updatedContact) {
      setContacts(prev => 
        prev.map(contact => 
          contact.id === id ? { ...contact, ...updatedContact } : contact
        )
      );
    }
    return updatedContact;
  };

  const deleteContact = async (id: string) => {
    await apiDeleteContact(id);
    setContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const deleteMultipleContacts = async (ids: string[]) => {
    await apiDeleteMultipleContacts(ids);
    setContacts(prev => prev.filter(contact => !ids.includes(contact.id)));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Initial fetch
    refetchContacts();
  }, [user?.id]);

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    deleteMultipleContacts,
    refetch: refetchContacts,
  };
}
