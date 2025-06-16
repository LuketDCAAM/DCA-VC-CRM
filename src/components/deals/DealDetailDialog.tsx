
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DealDetailHeader } from './detail/DealDetailHeader';
import { DealDetailContent } from './detail/DealDetailContent';
import { DealDetailSections } from './detail/DealDetailSections';
import { Deal } from '@/types/deal';

interface DealDetailDialogProps {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealUpdated: () => void;
}

export function DealDetailDialog({ deal, open, onOpenChange, onDealUpdated }: DealDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsEditing(false);
    }
  }, [open]);

  const handleSave = () => {
    setIsEditing(false);
    onDealUpdated();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DealDetailHeader 
          isEditing={isEditing} 
          onEditClick={handleEditClick} 
        />

        <DealDetailContent
          deal={deal}
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        <DealDetailSections deal={deal} />
      </DialogContent>
    </Dialog>
  );
}
