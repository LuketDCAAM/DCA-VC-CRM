
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

interface CSVTemplateDownloadProps {
  title: string;
  templateColumns: { key: string; label: string; required?: boolean }[];
}

export function CSVTemplateDownload({ title, templateColumns }: CSVTemplateDownloadProps) {
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

  return (
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
  );
}
