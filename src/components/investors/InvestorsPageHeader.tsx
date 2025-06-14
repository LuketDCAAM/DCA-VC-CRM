
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { ExportData } from '@/components/common/ExportData';
import { CSVImport } from '@/components/common/CSVImport';

interface InvestorsPageHeaderProps {
  onAddNew: () => void;
  exportData: any[];
  exportColumns: { key: string; label: string }[];
  loading: boolean;
  csvTemplateColumns: { key: string; label: string; required?: boolean }[];
  onCSVImport: (data: any[]) => Promise<any>;
}

export function InvestorsPageHeader({
  onAddNew,
  exportData,
  exportColumns,
  loading,
  csvTemplateColumns,
  onCSVImport,
}: InvestorsPageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Investors</h1>
        <p className="text-gray-600">Manage your investor relationships</p>
      </div>
      <div className="flex items-center gap-2">
        <ExportData
          data={exportData}
          filename="investors"
          columns={exportColumns}
          loading={loading}
        />
        <CSVImport
          title="Import Investors"
          description="Upload a CSV file to import multiple investors at once"
          templateColumns={csvTemplateColumns}
          onImport={onCSVImport}
        >
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </CSVImport>
        <Button onClick={onAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Investor
        </Button>
      </div>
    </div>
  );
}
