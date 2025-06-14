
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
import { CallNote } from '@/hooks/useCallNotes';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  call_date: z.date({ required_error: 'Call date is required' }),
  content: z.string().optional(),
});

export type CallNoteFormData = z.infer<typeof formSchema>;

interface CallNoteFormProps {
  onSubmit: (values: CallNoteFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  noteToEdit?: CallNote | null;
}

export function CallNoteForm({ onSubmit, onCancel, isSubmitting, noteToEdit }: CallNoteFormProps) {
  const form = useForm<CallNoteFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      call_date: new Date(),
      content: '',
    },
  });

  React.useEffect(() => {
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
  }, [noteToEdit, form]);
  
  return (
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
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

