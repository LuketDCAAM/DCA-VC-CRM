
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { CallNote, NewCallNote, UpdatedCallNote } from '@/hooks/useCallNotes';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  call_date: z.date({ required_error: 'Call date is required' }),
  content: z.string().optional(),
});

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      call_date: new Date(),
      content: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (noteToEdit) {
        form.reset({
          title: noteToEdit.title,
          call_date: new Date(noteToEdit.call_date),
          content: noteToEdit.content || '',
        });
      } else {
        form.reset({
          title: '',
          call_date: new Date(),
          content: '',
        });
      }
    }
  }, [noteToEdit, open, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
        toast({
            title: 'Error',
            description: 'You must be logged in.',
            variant: 'destructive'
        });
        return;
    }

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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{noteToEdit ? 'Edit Call Note' : 'Add Call Note'}</DialogTitle>
          <DialogDescription>
            {noteToEdit ? 'Update the details of the call note.' : 'Log a new call or meeting.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Intro Call with CEO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="call_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Call Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Key takeaways, action items, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
