
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface CSVPreviewTableProps {
  previewData: any[];
  templateColumns: { key: string; label: string; required?: boolean }[];
}

export function CSVPreviewTable({ previewData, templateColumns }: CSVPreviewTableProps) {
  if (previewData.length === 0) return null;

  return (
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
  );
}
