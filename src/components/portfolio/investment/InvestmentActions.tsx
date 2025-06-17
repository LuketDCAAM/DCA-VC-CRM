
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, X, Plus } from 'lucide-react';

interface InvestmentActionsProps {
  onSave: () => void;
  onCancel: () => void;
  onAddNew: () => void;
  isSubmitting: boolean;
}

export function InvestmentActions({ onSave, onCancel, onAddNew, isSubmitting }: InvestmentActionsProps) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Edit Investments</h3>
      <div className="flex gap-2">
        <Button onClick={onAddNew} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Investment
        </Button>
        <Button onClick={onSave} disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={onCancel} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
