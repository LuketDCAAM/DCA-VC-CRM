
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ExportDataProps {
  data: any[];
  filename: string;
  columns: { key: string; label: string }[];
  loading?: boolean;
  selectedIds?: string[];
}

export function ExportData({ data, filename, columns, loading = false, selectedIds = [] }: ExportDataProps) {
  const { toast } = useToast();

  // Filter data based on selection
  const dataToExport = selectedIds.length > 0 
    ? data.filter(item => selectedIds.includes(item.id))
    : data;

  const exportToCSV = () => {
    try {
      const headers = columns.map(col => col.label).join(',');
      const rows = dataToExport.map(item =>
        columns.map(col => {
          let value = item[col.key];
          if (value === null || value === undefined) value = '';
          if (typeof value === 'object') value = JSON.stringify(value);
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `${dataToExport.length} records exported to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = () => {
    try {
      const jsonData = dataToExport.map(item => {
        const exportItem: any = {};
        columns.forEach(col => {
          exportItem[col.label] = item[col.key];
        });
        return exportItem;
      });

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json;charset=utf-8;' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `${dataToExport.length} records exported to JSON`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    }
  };

  if (data.length === 0) {
    return null;
  }

  const exportLabel = selectedIds.length > 0 
    ? `Export Selected (${selectedIds.length})` 
    : `Export All (${data.length})`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {exportLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
