
import React from 'react';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ExportData } from '@/components/common/ExportData';
import { Contact } from '@/types/contact';

interface ContactsHeaderProps {
  exportData: any[];
  loading: boolean;
  onContactSaved: () => void;
}

const exportColumns = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'company_or_firm', label: 'Company/Firm' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'contact_type', label: 'Contact Type' },
  { key: 'created_at', label: 'Date Added' },
];

export function ContactsHeader({ exportData, loading, onContactSaved }: ContactsHeaderProps) {
  return (
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
        <AddContactDialog onContactSaved={onContactSaved} />
      </div>
    </div>
  );
}
