
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface CSVValidationErrorsProps {
  validationErrors: ValidationError[];
}

export function CSVValidationErrors({ validationErrors }: CSVValidationErrorsProps) {
  if (validationErrors.length === 0) return null;

  return (
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
  );
}
