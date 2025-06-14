
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, RefreshCw } from 'lucide-react';
import { ExportData } from '@/components/common/ExportData';
import { CSVImport } from '@/components/common/CSVImport';
import AddPortfolioDialog from '@/components/portfolio/AddPortfolioDialog';

interface PortfolioHeaderProps {
  exportData: any[];
  exportColumns: { key: string; label: string }[];
  loading: boolean;
  csvTemplateColumns: { key: string; label: string; required?: boolean }[];
  onImport: (data: any[]) => Promise<any>;
  onSync: () => void;
  onSuccess: () => void;
}

export function PortfolioHeader({
  exportData,
  exportColumns,
  loading,
  csvTemplateColumns,
  onImport,
  onSync,
  onSuccess,
}: PortfolioHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Companies</h1>
        <p className="text-gray-600">Track your invested companies</p>
      </div>
      <div className="flex items-center gap-2">
        <ExportData
          data={exportData}
          filename="portfolio-companies"
          columns={exportColumns}
          loading={loading}
        />
        <CSVImport
          title="Import Portfolio Companies"
          description="Upload a CSV file to import multiple portfolio companies at once"
          templateColumns={csvTemplateColumns}
          onImport={onImport}
        >
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </CSVImport>
        <Button variant="outline" size="sm" onClick={onSync}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Invested Deals
        </Button>
        <AddPortfolioDialog onSuccess={onSuccess}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </AddPortfolioDialog>
      </div>
    </div>
  );
}
