
import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, Link, X, Upload, File } from 'lucide-react';
import { Control } from 'react-hook-form';
import { DealFormValues } from './dealEditFormSchema';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FileAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface DealEditAttachmentsSectionProps {
  control: Control<DealFormValues>;
  dealId: string;
  pitchDeckFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DealEditAttachmentsSection({ 
  control, 
  dealId,
  pitchDeckFile, 
  onFileChange 
}: DealEditAttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAttachments();
  }, [dealId]);

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('deal_id', dealId)
      .neq('file_type', 'investor_info'); // Exclude investor info attachments

    if (error) {
      console.error('Error fetching attachments:', error);
      return;
    }

    setAttachments(data || []);
  };

  const handleAdditionalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAdditionalFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAdditionalFiles = async () => {
    if (additionalFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of additionalFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${dealId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pitch-decks')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pitch-decks')
          .getPublicUrl(fileName);

        const { error: attachmentError } = await supabase
          .from('file_attachments')
          .insert({
            deal_id: dealId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: 'file',
            file_size: file.size,
            uploaded_by: user?.id as string
          });

        if (attachmentError) throw attachmentError;
      }

      setAdditionalFiles([]);
      fetchAttachments();
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAttachment = async (attachment: FileAttachment) => {
    try {
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      // Also delete from storage if it's a file (not a link)
      if (attachment.file_type === 'file') {
        const fileName = attachment.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('pitch-decks')
            .remove([fileName]);
        }
      }

      fetchAttachments();
      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast({
        title: "Error",
        description: "Failed to delete attachment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="md:col-span-2 space-y-4">
      <h4 className="font-medium">Attachments & Links</h4>
      
      {/* Pitch Deck Section */}
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

      {/* Additional Files Section */}
      <div className="space-y-3">
        <FormLabel className="flex items-center gap-1">
          <File className="h-4 w-4" /> Additional Files
        </FormLabel>
        
        <div className="flex gap-2">
          <Input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            onChange={handleAdditionalFileChange}
            className="flex-1"
          />
          {additionalFiles.length > 0 && (
            <Button 
              type="button" 
              onClick={uploadAdditionalFiles}
              disabled={isUploading}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-1" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          )}
        </div>

        {/* Show selected files to upload */}
        {additionalFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Files to upload:</p>
            {additionalFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAdditionalFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Show existing attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Existing attachments:</p>
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  {attachment.file_type === 'link' ? (
                    <Link className="h-4 w-4" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{attachment.file_name}</p>
                    {attachment.file_size > 0 && (
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {attachment.file_type === 'link' ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                    >
                      Open
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                    >
                      Download
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAttachment(attachment)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
