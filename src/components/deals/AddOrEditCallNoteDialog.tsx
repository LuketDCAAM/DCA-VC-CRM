
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { CallNote, NewCallNote, UpdatedCallNote } from '@/hooks/useCallNotes';
import { useToast } from '@/hooks/use-toast';
import { CallNoteForm, CallNoteFormData } from './form/CallNoteForm';

interface AddOrEditCallNoteDialogProps {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteAddedOrUpdated: () => void;
  addCallNote: (note: NewCallNote) => Promise<any>;
  updateCallNote: (note: UpdatedCallNote & { id: string }) => Promise<any>;
  noteToEdit?: CallNote | null;
}

export function AddOrEditCallNoteDialog({
  dealId,
  open,
  onOpenChange,
  onNoteAddedOrUpdated,
  addCallNote,
  updateCallNote,
  noteToEdit,
}: AddOrEditCallNoteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(isOpen);
    }
  };
  
  const onSubmit = async (values: CallNoteFormData) => {
    if (!user) {
        toast({
            title: 'Error',
            description: 'You must be logged in.',
            variant: 'destructive'
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const formattedDate = format(values.call_date, 'yyyy-MM-dd');
        if (noteToEdit) {
            await updateCallNote({
                id: noteToEdit.id,
                title: values.title,
                content: values.content,
                call_date: formattedDate,
            });
            toast({ title: 'Success', description: 'Call note updated.' });
        } else {
            await addCallNote({
                deal_id: dealId,
                created_by: user.id,
                title: values.title,
                content: values.content,
                call_date: formattedDate,
            });
            toast({ title: 'Success', description: 'Call note added.' });
        }
        onNoteAddedOrUpdated();
        onOpenChange(false);
    } catch(error: any) {
        toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive'
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{noteToEdit ? 'Edit Call Note' : 'Add Call Note'}</DialogTitle>
          <DialogDescription>
            {noteToEdit ? 'Update the details of the call note.' : 'Log a new call or meeting.'}
          </DialogDescription>
        </DialogHeader>
        <CallNoteForm
          onSubmit={onSubmit}
          onCancel={() => handleOpenChange(false)}
          isSubmitting={isSubmitting}
          noteToEdit={noteToEdit}
        />
      </DialogContent>
    </Dialog>
  );
}

