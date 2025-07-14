
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { AddDealForm } from './form/AddDealForm';

interface AddDealDialogProps {
  onDealAdded: () => void;
  children?: React.ReactNode;
}

export function AddDealDialog({ onDealAdded, children }: AddDealDialogProps) {
  const [open, setOpen] = useState(false);

  console.log('AddDealDialog render - open:', open);

  const handleSuccess = () => {
    console.log('AddDealDialog - handleSuccess called');
    setOpen(false);
    onDealAdded();
  };

  const handleCancel = () => {
    console.log('AddDealDialog - handleCancel called');
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('AddDealDialog - handleOpenChange called with:', newOpen);
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>
            Create a new deal to track in your investment pipeline.
          </DialogDescription>
        </DialogHeader>
        <AddDealForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}
