
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle2, X, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CSVImportProps {
  title: string;
  description: string;
  templateColumns: { key: string; label: string; required?: boolean }[];
  onImport: (data: any[]) => Promise<{ success: boolean; errors?: string[]; imported?: number; error?: string }>;
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
  const [importResult, setImportResult] = useState<{ success: boolean; errors?: string[]; imported?: number; error?: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = templateColumns.map(col => col.label).join(',');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (csvText: string): any[] => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];

      // Handle CSV parsing with proper quote handling
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
      console.log('Parsed CSV headers:', headers);
      
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          const column = templateColumns.find(col => 
            col.label.toLowerCase() === header.toLowerCase() ||
            col.key.toLowerCase() === header.toLowerCase()
          );
          if (column) {
            row[column.key] = values[index] || '';
          }
        });
        
        // Only add rows that have at least one non-empty value
        if (Object.values(row).some(val => val && String(val).trim() !== '')) {
          data.push(row);
        }
      }

      console.log('Parsed CSV data:', data.length, 'rows');
      return data;
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw new Error('Failed to parse CSV file. Please check the file format.');
    }
  };

  const validateData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      templateColumns.forEach(column => {
        if (column.required && (!row[column.key] || String(row[column.key]).trim() === '')) {
          errors.push({
            row: index + 1,
            field: column.label,
            message: `${column.label} is required`
          });
        }
      });
    });

    return errors;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setFile(selectedFile);
      setValidationErrors([]);
      setImportResult(null);
      
      try {
        // Parse and preview the data
        const text = await selectedFile.text();
        const data = parseCSV(text);
        setPreviewData(data.slice(0, 5)); // Show first 5 rows as preview
        
        // Validate the data
        const errors = validateData(data);
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
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        toast({
          title: "No data found",
          description: "The CSV file appears to be empty or invalid",
          variant: "destructive",
        });
        return;
      }

      const errors = validateData(data);
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: "Validation errors",
          description: `Please fix ${errors.length} validation errors before importing`,
          variant: "destructive",
        });
        return;
      }

      console.log('Starting import process with', data.length, 'rows');
      const result = await onImport(data);
      setImportResult(result);
      
      if (result.success) {
        // Reset form on success
        setFile(null);
        setValidationErrors([]);
        setPreviewData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Close dialog after successful import
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
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
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Step 1: Download Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Download the template, fill it with your data, and upload it back.
              </p>
            </CardContent>
          </Card>

          {/* File Upload */}
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

          {/* Data Preview */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Data Preview (First 5 rows)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b">
                        {templateColumns.map(col => (
                          <th key={col.key} className="text-left p-2 font-medium">
                            {col.label}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b">
                          {templateColumns.map(col => (
                            <td key={col.key} className="p-2 max-w-32 truncate">
                              {row[col.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Please fix the following errors:</p>
                  <div className="max-h-32 overflow-y-auto">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-xs">
                        Row {error.row}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 10 && (
                      <div className="text-xs text-gray-500">
                        ...and {validationErrors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Result */}
          {importResult && (
            <Alert variant={importResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {importResult.success ? (
                    <p className="font-medium text-green-700">
                      Import completed successfully! {importResult.imported} records imported.
                    </p>
                  ) : (
                    <p className="font-medium">
                      Import failed: {importResult.error}
                    </p>
                  )}
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div>
                      <p className="font-medium">Errors:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-xs">{error}</div>
                        ))}
                        {importResult.errors.length > 10 && (
                          <div className="text-xs text-gray-500">
                            ...and {importResult.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              onClick={resetForm}
              variant="outline"
              disabled={importing}
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing || validationErrors.length > 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
