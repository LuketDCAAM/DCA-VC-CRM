
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CSVTemplateDownload } from './csv/CSVTemplateDownload';
import { CSVFileUpload } from './csv/CSVFileUpload';
import { CSVPreviewTable } from './csv/CSVPreviewTable';
import { CSVValidationErrors } from './csv/CSVValidationErrors';
import { CSVDataQualityWarnings } from './csv/CSVDataQualityWarnings';
import { CSVImportResult } from './csv/CSVImportResult';
import { CSVImportActions } from './csv/CSVImportActions';
import { useCSVParser } from './csv/useCSVParser';

interface CSVImportProps {
  title: string;
  description: string;
  templateColumns: { key: string; label: string; required?: boolean }[];
  onImport: (data: any[]) => Promise<{ 
    success: boolean; 
    errors?: string[]; 
    warnings?: string[];
    imported?: number; 
    error?: string;
    qualityScore?: number;
  }>;
  children: React.ReactNode;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function CSVImport({ title, description, templateColumns, onImport, children }: CSVImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [dataQualityWarnings, setDataQualityWarnings] = useState<string[]>([]);
  const [qualityScore, setQualityScore] = useState<number | undefined>(undefined);
  const [importResult, setImportResult] = useState<{ 
    success: boolean; 
    errors?: string[]; 
    warnings?: string[];
    imported?: number; 
    error?: string;
    qualityScore?: number;
  } | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { parseCSV, validateData } = useCSVParser();

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setValidationErrors([]);
    setDataQualityWarnings([]);
    setQualityScore(undefined);
    setImportResult(null);
    
    try {
      // Parse and preview the data
      const text = await selectedFile.text();
      const data = parseCSV(text);
      
      // Map headers to template columns
      const mappedData = data.map(row => {
        const mappedRow: any = {};
        templateColumns.forEach(column => {
          const foundValue = Object.entries(row).find(([key]) => 
            key.toLowerCase() === column.label.toLowerCase() ||
            key.toLowerCase() === column.key.toLowerCase()
          );
          mappedRow[column.key] = foundValue ? foundValue[1] : '';
        });
        return mappedRow;
      });
      
      setPreviewData(mappedData.slice(0, 5)); // Show first 5 rows as preview
      
      // Validate the data
      const errors = validateData(mappedData, templateColumns);
      setValidationErrors(errors);
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "File processing error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
      setFile(null);
      setPreviewData([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      // Map headers to template columns
      const mappedData = data.map(row => {
        const mappedRow: any = {};
        templateColumns.forEach(column => {
          const foundValue = Object.entries(row).find(([key]) => 
            key.toLowerCase() === column.label.toLowerCase() ||
            key.toLowerCase() === column.key.toLowerCase()
          );
          mappedRow[column.key] = foundValue ? foundValue[1] : '';
        });
        return mappedRow;
      });
      
      if (mappedData.length === 0) {
        toast({
          title: "No data found",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive",
        });
        return;
      }

      const errors = validateData(mappedData, templateColumns);
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Validation errors",
          description: `Please fix ${errors.length} validation errors before importing`,
          variant: "destructive",
        });
        return;
      }

      console.log('Starting import process with', mappedData.length, 'rows');
      const result = await onImport(mappedData);
      setImportResult(result);
      
      // Set data quality warnings and score
      if (result.warnings) {
        setDataQualityWarnings(result.warnings);
      }
      if (result.qualityScore) {
        setQualityScore(result.qualityScore);
      }
      
      if (result.success) {
        // Reset form on success
        resetForm();
        
        // Close dialog after successful import
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred while processing the file",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setValidationErrors([]);
    setDataQualityWarnings([]);
    setQualityScore(undefined);
    setImportResult(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <CSVTemplateDownload title={title} templateColumns={templateColumns} />
          
          <CSVFileUpload 
            file={file} 
            onFileSelect={handleFileSelect} 
            fileInputRef={fileInputRef} 
          />

          <CSVPreviewTable 
            previewData={previewData} 
            templateColumns={templateColumns} 
          />

          <CSVValidationErrors validationErrors={validationErrors} />

          <CSVDataQualityWarnings 
            warnings={dataQualityWarnings} 
            qualityScore={qualityScore}
          />

          <CSVImportResult importResult={importResult} />

          <CSVImportActions
            file={file}
            importing={importing}
            validationErrors={validationErrors}
            onReset={resetForm}
            onImport={handleImport}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
