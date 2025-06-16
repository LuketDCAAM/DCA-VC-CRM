
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactsHeader } from '@/components/contacts/ContactsHeader';
import { ContactsStats } from '@/components/contacts/ContactsStats';
import { ContactsEmptyState } from '@/components/contacts/ContactsEmptyState';
import { ContactsGrid } from '@/components/contacts/ContactsGrid';
import { contactsFilterOptions } from '@/components/contacts/ContactsFilters';
import { contactsBulkActions } from '@/components/contacts/ContactsBulkActions';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { BulkActions } from '@/components/common/BulkActions';
import { useContacts } from '@/hooks/useContacts';
import { useContactsFilters } from '@/hooks/contacts/useContactsFilters';
import { Contact } from '@/types/contact';

export default function Contacts() {
  const { contacts, loading, deleteContact, deleteMultipleContacts, refetch } = useContacts();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    filteredContacts,
    handleFilterChange,
    handleClearFilters
  } = useContactsFilters(contacts);

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditDialogOpen(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(contactId);
    }
  };

  const handleContactSaved = () => {
    setEditDialogOpen(false);
    setSelectedContact(null);
    refetch();
  };

  const handleBulkAction = async (actionId: string, selectedIds: string[]) => {
    if (actionId === 'delete') {
      if (selectedIds.length > 0) {
        await deleteMultipleContacts(selectedIds);
      }
    } else {
      console.log(`Bulk action ${actionId} on contacts:`, selectedIds);
      // TODO: Implement other bulk actions
    }
    setSelectedContacts([]);
  };

  const handleSelectAll = () => {
    setSelectedContacts(filteredContacts.map(contact => contact.id));
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const handleSelectContact = (contactId: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  // Prepare export data with calculated fields
  const exportData = filteredContacts.map(contact => ({
    ...contact,
    contact_type: contact.deal_id ? 'Deal Contact' : 
                  contact.investor_id ? 'Investor Contact' : 
                  contact.portfolio_company_id ? 'Portfolio Contact' : 'General Contact',
  }));

  if (loading) {
    return (
      <div className="p-6">
        <ContactsHeader 
          exportData={exportData}
          loading={loading}
          onContactSaved={refetch}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ContactsHeader 
        exportData={exportData}
        loading={loading}
        onContactSaved={refetch}
      />

      {contacts.length === 0 ? (
        <ContactsEmptyState onContactSaved={refetch} />
      ) : (
        <div className="space-y-6">
          <ContactsStats contacts={contacts} />

          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={contactsFilterOptions}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            placeholder="Search contacts by name, company, or email..."
            showAdvanced={showAdvancedFilters}
            onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          />

          <BulkActions
            selectedItems={selectedContacts}
            totalItems={filteredContacts.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            actions={contactsBulkActions}
            onAction={handleBulkAction}
            isAllSelected={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
          />

          <ContactsGrid
            contacts={filteredContacts}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
          />
        </div>
      )}

      {selectedContact && (
        <AddContactDialog
          contact={selectedContact}
          onContactSaved={handleContactSaved}
          trigger={<div />}
        />
      )}
    </div>
  );
}
