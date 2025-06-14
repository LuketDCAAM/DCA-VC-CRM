
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCallNotes, CallNote } from '@/hooks/useCallNotes';
import { CallNoteCard } from './CallNoteCard';
import { AddOrEditCallNoteDialog } from './AddOrEditCallNoteDialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CallNotesManagerProps {
  dealId: string;
}

export function CallNotesManager({ dealId }: CallNotesManagerProps) {
  const { callNotes, isLoading, addCallNote, updateCallNote, deleteCallNote } = useCallNotes(dealId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<CallNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleAddNote = () => {
    setNoteToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: CallNote) => {
    setNoteToEdit(note);
    setIsDialogOpen(true);
  };
  
  const handleDeleteRequest = (noteId: string) => {
    setNoteToDelete(noteId);
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    try {
      await deleteCallNote(noteToDelete);
      toast({ title: 'Success', description: 'Call note deleted.' });
      setNoteToDelete(null);
    } catch(error: any) {
        toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive'
        });
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Call Notes</h3>
        <Button onClick={handleAddNote} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      )}

      {!isLoading && callNotes.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500">No call notes yet.</p>
          <p className="text-sm text-gray-400">Click "Add Note" to log your first call.</p>
        </div>
      )}

      {!isLoading && callNotes.length > 0 && (
        <div className="space-y-4">
          {callNotes.map((note) => (
            <CallNoteCard key={note.id} note={note} onEdit={handleEditNote} onDelete={handleDeleteRequest} />
          ))}
        </div>
      )}

      <AddOrEditCallNoteDialog
        dealId={dealId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onNoteAddedOrUpdated={() => {}}
        addCallNote={addCallNote}
        updateCallNote={updateCallNote}
        noteToEdit={noteToEdit}
      />
      
      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the call note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
