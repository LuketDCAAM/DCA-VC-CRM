
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddDealDialog } from './AddDealDialog';
import { OutlookCalendarSyncButton } from '@/components/outlook/OutlookCalendarSyncButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { CSVImport } from '@/components/common/CSVImport';
import { ExportData } from '@/components/common/ExportData';

interface DealsHeaderProps {
  filteredDeals: any[];
  exportColumns: any[];
  loading: boolean;
  csvTemplateColumns: any[];
  onCSVImport: (data: any[]) => Promise<any>;
  onDealAdded: () => void;
}

export function DealsHeader({ 
  filteredDeals, 
  exportColumns, 
  loading, 
  csvTemplateColumns, 
  onCSVImport, 
  onDealAdded 
}: DealsHeaderProps) {
  const { isAuthenticated, loading: authLoading } = useMicrosoftAuth();

  console.log('DealsHeader - Microsoft auth status:', { isAuthenticated, authLoading });


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">
            Manage your investment pipeline and track deal progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OutlookCalendarSyncButton 
            variant="outline" 
            size="default" 
            showLabel={true} 
          />
          <CSVImport
            title="Import Deals"
            description="Upload a CSV file to import deals into your pipeline"
            onImport={onCSVImport}
            templateColumns={csvTemplateColumns}
          >
            <Button variant="outline">
              Import
            </Button>
          </CSVImport>
          <ExportData
            data={filteredDeals}
            filename="deals"
            columns={exportColumns}
            loading={loading}
          />
          <AddDealDialog onDealAdded={onDealAdded}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </AddDealDialog>
        </div>
      </div>
    </div>
  );
}
