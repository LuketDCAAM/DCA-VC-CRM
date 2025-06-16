
import React, { useState } from 'react';
import { Contact } from '@/types/contact';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { BulkActions } from '@/components/common/BulkActions';
import { ContactsGrid } from '@/components/contacts/ContactsGrid';
import { contactsFilterOptions } from '@/components/contacts/ContactsFilters';
import { contactsBulkActions } from '@/components/contacts/ContactsBulkActions';
import { useContactsFilters } from '@/hooks/contacts/useContactsFilters';

interface ContactsWithFiltersProps {
  contacts: Contact[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => Promise<void>;
  onDeleteMultipleContacts: (ids: string[]) => Promise<void>;
}

export function ContactsWithFilters({
  contacts,
  onEditContact,
  onDeleteContact,
  onDeleteMultipleContacts
}: ContactsWithFiltersProps) {
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

  const handleBulkAction = async (actionId: string, selectedIds: string[]) => {
    if (actionId === 'delete') {
      if (selectedIds.length > 0) {
        await onDeleteMultipleContacts(selectedIds);
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

  return (
    <>
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
        onEditContact={onEditContact}
        onDeleteContact={onDeleteContact}
      />
    </>
  );
}
