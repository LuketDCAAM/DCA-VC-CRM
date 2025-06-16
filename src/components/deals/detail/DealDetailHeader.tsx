
import React from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface DealDetailHeaderProps {
  isEditing: boolean;
  onEditClick: () => void;
}

export function DealDetailHeader({ isEditing, onEditClick }: DealDetailHeaderProps) {
  return (
    <DialogHeader>
      <div className="flex justify-between items-center">
        <DialogTitle className="text-xl">
          {isEditing ? 'Edit Deal' : 'Deal Details'}
        </DialogTitle>
        {!isEditing && (
          <Button onClick={onEditClick} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Deal
          </Button>
        )}
      </div>
    </DialogHeader>
  );
}
