
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Paperclip, Link } from 'lucide-react';
import { Control } from 'react-hook-form';
import { DealFormValues } from './dealEditFormSchema';

interface DealEditAttachmentsSectionProps {
  control: Control<DealFormValues>;
  pitchDeckFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DealEditAttachmentsSection({ 
  control, 
  pitchDeckFile, 
  onFileChange 
}: DealEditAttachmentsSectionProps) {
  return (
    <div className="md:col-span-2 space-y-4">
      <h4 className="font-medium">Attachments & Links</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormItem>
          <FormLabel className="flex items-center gap-1">
            <Paperclip className="h-4 w-4" /> Pitch Deck File
          </FormLabel>
          <FormControl>
            <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={onFileChange} />
          </FormControl>
          {pitchDeckFile && <p className="text-sm text-muted-foreground mt-1">Selected: {pitchDeckFile.name}</p>}
          <FormMessage />
        </FormItem>

        <FormField
          control={control}
          name="pitch_deck_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Link className="h-4 w-4" /> Pitch Deck Link
              </FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://docs.google.com/presentation/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
