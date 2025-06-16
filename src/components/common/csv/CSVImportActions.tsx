
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface CSVImportActionsProps {
  file: File | null;
  importing: boolean;
  validationErrors: any[];
  onReset: () => void;
  onImport: () => void;
}

export function CSVImportActions({ 
  file, 
  importing, 
  validationErrors, 
  onReset, 
  onImport 
}: CSVImportActionsProps) {
  return (
    <div className="flex justify-between">
      <Button
        onClick={onReset}
        variant="outline"
        disabled={importing}
      >
        <X className="h-4 w-4 mr-2" />
        Reset
      </Button>
      <Button
        onClick={onImport}
        disabled={!file || importing || validationErrors.length > 0}
      >
        <Upload className="h-4 w-4 mr-2" />
        {importing ? 'Importing...' : 'Import Data'}
      </Button>
    </div>
  );
}
