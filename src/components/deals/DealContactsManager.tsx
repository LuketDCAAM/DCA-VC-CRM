
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactCard } from '@/components/contacts/ContactCard';
import { Skeleton } from '@/components/ui/skeleton';

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

interface Deal {
  id: string;
  company_name: string;
}

interface DealContactsManagerProps {
  deal: Deal;
}

export function DealContactsManager({ deal }: DealContactsManagerProps) {
  const { contacts, loading: contactsLoading, deleteContact, refetch, updateContact } = useContacts();
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const dealContacts = useMemo(() => {
    return contacts.filter(c => c.deal_id === deal.id);
  }, [contacts, deal.id]);

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(contactId);
    }
  };

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Associated Contacts</h3>
        <Button onClick={() => setIsAddContactOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
      
      {contactsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : dealContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dealContacts.map(contact => (
            <ContactCard 
              key={contact.id} 
              contact={contact}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No contacts associated with this deal yet.</p>
      )}

      <AddContactDialog
        open={isAddContactOpen}
        onOpenChange={setIsAddContactOpen}
        preselectedDeal={deal}
        onContactSaved={() => {
          setIsAddContactOpen(false);
          refetch();
        }}
      />
      
      {selectedContact && (
        <AddContactDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          contact={selectedContact}
          onContactSaved={handleContactSaved}
        />
      )}
    </div>
  );
}
