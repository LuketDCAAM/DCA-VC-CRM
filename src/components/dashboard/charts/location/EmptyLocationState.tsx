
import React from 'react';
import { Building2 } from 'lucide-react';

interface EmptyLocationStateProps {
  showActiveOnly: boolean;
}

export function EmptyLocationState({ showActiveOnly }: EmptyLocationStateProps) {
  return (
    <div className="text-center text-muted-foreground py-12">
      <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
      <p className="text-lg font-medium mb-2">
        {showActiveOnly ? 'No active deals found' : 'No location data available'}
      </p>
      <p className="text-sm">
        {showActiveOnly 
          ? 'Switch to "Total Deals" to see all deals or add active deals with location information'
          : 'Add location information to deals to see geographic distribution'
        }
      </p>
    </div>
  );
}
