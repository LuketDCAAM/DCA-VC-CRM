
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface DealEditFormHeaderProps {
  isUpdating: boolean;
  onCancel: () => void;
}

export function DealEditFormHeader({ isUpdating, onCancel }: DealEditFormHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Edit Deal</h3>
      <div className="flex gap-2">
        <Button type="submit" disabled={isUpdating}>
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={onCancel} variant="outline" type="button">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
