
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  errors?: string[];
  imported?: number;
  error?: string;
}

interface CSVImportResultProps {
  importResult: ImportResult | null;
}

export function CSVImportResult({ importResult }: CSVImportResultProps) {
  if (!importResult) return null;

  return (
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
  );
}
