
import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CSVFileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function CSVFileUpload({ file, onFileSelect, fileInputRef }: CSVFileUploadProps) {
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      onFileSelect(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Step 2: Upload Your CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="mb-3"
        />
        {file && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {file.name} selected ({Math.round(file.size / 1024)}KB)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
