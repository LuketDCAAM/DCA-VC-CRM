
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { ExportData } from '@/components/common/ExportData';
import { CSVImport } from '@/components/common/CSVImport';
import { Deal } from '@/types/deal';

interface DealsHeaderProps {
  filteredDeals: Deal[];
  exportColumns: { key: string; label: string }[];
  loading: boolean;
  csvTemplateColumns: { key: string; label: string; required?: boolean }[];
  onCSVImport: (data: any[]) => Promise<{ success: boolean; error?: string }>;
  onDealAdded: () => void;
}

export function DealsHeader({
  filteredDeals,
  exportColumns,
  loading,
  csvTemplateColumns,
  onCSVImport,
  onDealAdded,
}: DealsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Deal Flow</h1>
        <p className="text-gray-600">Manage your investment pipeline</p>
      </div>
      <div className="flex items-center gap-2">
        <ExportData
          data={filteredDeals}
          filename="deals"
          columns={exportColumns}
          loading={loading}
        />
        <CSVImport
          title="Import Deals"
          description="Upload a CSV file to import multiple deals at once"
          templateColumns={csvTemplateColumns}
          onImport={onCSVImport}
        >
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Import CSV
          </Button>
        </CSVImport>
        <AddDealDialog onDealAdded={onDealAdded}>
          <Button size="sm" className="h-8 px-3 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Deal
          </Button>
        </AddDealDialog>
      </div>
    </div>
  );
}
