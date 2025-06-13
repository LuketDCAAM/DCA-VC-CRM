
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactCard } from '@/components/contacts/ContactCard';
import { useContacts } from '@/hooks/useContacts';
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
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
}

export default function Contacts() {
  const { contacts, loading, deleteContact, refetch } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company_or_firm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' ||
                         (filterType === 'deal' && contact.deal_id) ||
                         (filterType === 'investor' && contact.investor_id) ||
                         (filterType === 'general' && !contact.deal_id && !contact.investor_id);

    return matchesSearch && matchesFilter;
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
        <AddContactDialog onContactSaved={refetch} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="text-2xl font-bold text-orange-600">
                  {contacts.filter(c => !c.deal_id && !c.investor_id).length}
                </div>
                <p className="text-sm text-gray-600">General Contacts</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="deal">Deal Contacts</SelectItem>
                  <SelectItem value="investor">Investor Contacts</SelectItem>
                  <SelectItem value="general">General Contacts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
