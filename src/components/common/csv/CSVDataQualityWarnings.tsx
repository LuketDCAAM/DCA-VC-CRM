
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CSVDataQualityWarningsProps {
  warnings?: string[];
  qualityScore?: number;
}

export function CSVDataQualityWarnings({ warnings, qualityScore }: CSVDataQualityWarningsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {qualityScore !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Data Quality Score:</span>
          <Badge 
            variant={qualityScore >= 90 ? "default" : qualityScore >= 70 ? "secondary" : "destructive"}
            className={
              qualityScore >= 90 ? "bg-green-100 text-green-800" :
              qualityScore >= 70 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }
          >
            {qualityScore}%
          </Badge>
        </div>
      )}
      
      <Alert variant="default" className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium text-yellow-800">Data Quality Warnings:</p>
            <div className="max-h-32 overflow-y-auto">
              {warnings.slice(0, 10).map((warning, index) => (
                <div key={index} className="text-xs text-yellow-700">
                  {warning}
                </div>
              ))}
              {warnings.length > 10 && (
                <div className="text-xs text-yellow-600">
                  ...and {warnings.length - 10} more warnings
                </div>
              )}
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              <Info className="h-3 w-3 inline mr-1" />
              These warnings indicate potential data quality issues but won't prevent import.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
