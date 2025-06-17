
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ContactsHeader } from '@/components/contacts/ContactsHeader';

interface ContactsLoadingStateProps {
  onContactSaved: () => void;
}

export function ContactsLoadingState({ onContactSaved }: ContactsLoadingStateProps) {
  return (
    <div className="p-6">
      <ContactsHeader 
        exportData={[]}
        loading={true}
        onContactSaved={onContactSaved}
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
