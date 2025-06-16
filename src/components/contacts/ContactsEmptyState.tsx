
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';

interface ContactsEmptyStateProps {
  onContactSaved: () => void;
}

export function ContactsEmptyState({ onContactSaved }: ContactsEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Directory</CardTitle>
        <CardDescription>All contacts from deals and investors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No contacts found</p>
          <AddContactDialog 
            onContactSaved={onContactSaved}
            trigger={
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Add your first contact
              </button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
