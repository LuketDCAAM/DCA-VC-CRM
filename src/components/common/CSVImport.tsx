
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle2, X } from 'lucide-react';
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
  onImport: (data: any[]) => Promise<{ success: boolean; errors?: string[]; imported?: number }>;
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
  const [importResult, setImportResult] = useState<{ success: boolean; errors?: string[]; imported?: number } | null>(null);
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
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        const column = templateColumns.find(col => col.label === header);
        if (column) {
          row[column.key] = values[index] || '';
        }
      });
      
      data.push(row);
    }

    return data;
  };

  const validateData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      templateColumns.forEach(column => {
        if (column.required && (!row[column.key] || row[column.key].toString().trim() === '')) {
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
      setFile(selectedFile);
      setValidationErrors([]);
      setImportResult(null);
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
        return;
      }

      const result = await onImport(data);
      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.imported} records`,
        });
        // Reset form on success
        setFile(null);
        setValidationErrors([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "Import failed",
          description: "Some records could not be imported",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred while processing the file",
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  {file.name} selected
                </div>
              )}
            </CardContent>
          </Card>

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
          {importResult && !importResult.success && importResult.errors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Import completed with errors:</p>
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
