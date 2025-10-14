import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useEntityCallNotes } from '@/hooks/useEntityCallNotes';
import { CallNoteCard } from '@/components/deals/CallNoteCard';
import { AddOrEditCallNoteDialog } from '@/components/deals/AddOrEditCallNoteDialog';
import { CallNote, NewCallNote, UpdatedCallNote } from '@/hooks/useEntityCallNotes';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type EntityType = 'deal' | 'investor' | 'portfolio_company';

interface EntityCallNotesManagerProps {
  entityId: string;
  entityType: EntityType;
}

export function EntityCallNotesManager({ entityId, entityType }: EntityCallNotesManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<CallNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const { callNotes, isLoading, addCallNote, updateCallNote, deleteCallNote } = useEntityCallNotes({
    entityId,
    entityType,
  });

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
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    
    try {
      await deleteCallNote(noteToDelete);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Error deleting call note:', error);
    }
  };

  const handleNoteAddedOrUpdated = () => {
    setIsDialogOpen(false);
    setNoteToEdit(null);
  };

  const entityFieldMap = {
    deal: 'deal_id',
    investor: 'investor_id',
    portfolio_company: 'portfolio_company_id',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Call Notes</h3>
        <Button onClick={handleAddNote} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : callNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No call notes yet. Add your first note to track conversations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {callNotes.map((note) => (
            <CallNoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      <AddOrEditCallNoteDialog
        dealId={entityType === 'deal' ? entityId : ''}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onNoteAddedOrUpdated={handleNoteAddedOrUpdated}
        addCallNote={async (note: NewCallNote) => {
          const noteData = {
            ...note,
            [entityFieldMap[entityType]]: entityId,
          };
          return addCallNote(noteData as NewCallNote);
        }}
        updateCallNote={updateCallNote}
        noteToEdit={noteToEdit}
      />

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this call note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
