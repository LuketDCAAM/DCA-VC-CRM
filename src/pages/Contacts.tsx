import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Archive } from 'lucide-react';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactCard } from '@/components/contacts/ContactCard';
import { useContacts } from '@/hooks/useContacts';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchAndFilter, FilterOption } from '@/components/common/SearchAndFilter';
import { BulkActions, BulkAction } from '@/components/common/BulkActions';
import { ExportData } from '@/components/common/ExportData';

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

export default function Contacts() {
  const { contacts, loading, deleteContact, deleteMultipleContacts, refetch } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Filter options for contacts
  const filterOptions: FilterOption[] = [
    {
      key: 'contact_type',
      label: 'Contact Type',
      value: 'contact_type',
      type: 'select',
      options: [
        { label: 'Deal Contacts', value: 'deal' },
        { label: 'Investor Contacts', value: 'investor' },
        { label: 'Portfolio Contacts', value: 'portfolio' },
        { label: 'General Contacts', value: 'general' },
      ]
    },
    {
      key: 'has_email',
      label: 'Has Email',
      value: 'has_email',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ]
    },
    {
      key: 'has_phone',
      label: 'Has Phone',
      value: 'has_phone',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ]
    },
    {
      key: 'created_at',
      label: 'Date Added',
      value: 'created_at',
      type: 'date'
    }
  ];

  // Bulk actions for contacts
  const bulkActions: BulkAction[] = [
    {
      id: 'export-selected',
      label: 'Export Selected',
      icon: Edit,
      variant: 'default'
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'secondary'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      requiresConfirmation: true
    }
  ];

  // Export columns for contacts
  const exportColumns = [
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'company_or_firm', label: 'Company/Firm' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'contact_type', label: 'Contact Type' },
    { key: 'created_at', label: 'Date Added' },
  ];

  const filteredContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company_or_firm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Active filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value || value === 'all' || value === '') return true;
      
      if (key === 'contact_type') {
        if (value === 'deal') return contact.deal_id !== null;
        if (value === 'investor') return contact.investor_id !== null;
        if (value === 'portfolio') return contact.portfolio_company_id !== null;
        if (value === 'general') return !contact.deal_id && !contact.investor_id && !contact.portfolio_company_id;
      }
      
      if (key === 'has_email') {
        return value === 'yes' ? contact.email !== null : contact.email === null;
      }
      
      if (key === 'has_phone') {
        return value === 'yes' ? contact.phone !== null : contact.phone === null;
      }
      
      if (key === 'created_at') {
        const contactDate = new Date(contact.created_at).toISOString().split('T')[0];
        return contactDate >= value;
      }
      
      return true;
    });

    return matchesSearch && matchesFilters;
  });

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

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-gray-600">Unified contact directory</p>
          </div>
          <AddContactDialog onContactSaved={refetch} />
        </div>

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-gray-600">Unified contact directory</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportData
            data={exportData}
            filename="contacts"
            columns={exportColumns}
            loading={loading}
          />
          <AddContactDialog onContactSaved={refetch} />
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Contact Directory</CardTitle>
            <CardDescription>All contacts from deals and investors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No contacts found</p>
              <AddContactDialog 
                onContactSaved={refetch}
                trigger={
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Add your first contact
                  </button>
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{contacts.length}</div>
                <p className="text-sm text-gray-600">Total Contacts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {contacts.filter(c => c.deal_id).length}
                </div>
                <p className="text-sm text-gray-600">Deal Contacts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {contacts.filter(c => c.investor_id).length}
                </div>
                <p className="text-sm text-gray-600">Investor Contacts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-teal-600">
                  {contacts.filter(c => c.portfolio_company_id).length}
                </div>
                <p className="text-sm text-gray-600">Portfolio Contacts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {contacts.filter(c => !c.deal_id && !c.investor_id && !c.portfolio_company_id).length}
                </div>
                <p className="text-sm text-gray-600">General Contacts</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            placeholder="Search contacts by name, company, or email..."
            showAdvanced={showAdvancedFilters}
            onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedItems={selectedContacts}
            totalItems={filteredContacts.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            actions={bulkActions}
            onAction={handleBulkAction}
            isAllSelected={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
          />

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
              />
            ))}
          </div>

          {filteredContacts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No contacts match your search criteria</p>
            </div>
          )}
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
