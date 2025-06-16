
import React from 'react';
import { DealOverview } from '../DealOverview';
import { DealEditForm } from '../DealEditForm';
import { Deal } from '@/types/deal';

interface DealDetailContentProps {
  deal: Deal;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function DealDetailContent({ deal, isEditing, onSave, onCancel }: DealDetailContentProps) {
  return (
    <div className="mt-4">
      {isEditing ? (
        <DealEditForm
          deal={deal}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        <DealOverview deal={deal} />
      )}
    </div>
  );
}
