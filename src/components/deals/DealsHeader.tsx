
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { AddDealDialog } from './AddDealDialog';
import { OutlookCalendarSyncButton } from '@/components/outlook/OutlookCalendarSyncButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { CSVImport } from '@/components/common/CSVImport';
import { ExportData } from '@/components/common/ExportData';
import { BulkDuplicateSearchDialog } from './duplicates/BulkDuplicateSearchDialog';
import { Deal } from '@/types/deal';

interface DealsHeaderProps {
  filteredDeals: any[];
  exportColumns: any[];
  loading: boolean;
  csvTemplateColumns: any[];
  onCSVImport: (data: any[]) => Promise<any>;
  onDealAdded: () => void;
  allDeals: Deal[];
  selectedDeals: string[];
  onBulkAction: (action: string, dealIds: string[]) => Promise<void>;
}

export function DealsHeader({ 
  filteredDeals, 
  exportColumns, 
  loading, 
  csvTemplateColumns, 
  onCSVImport, 
  onDealAdded,
  allDeals,
  selectedDeals,
  onBulkAction
}: DealsHeaderProps) {
  const { isAuthenticated, loading: authLoading } = useMicrosoftAuth();
  const [showDuplicateSearch, setShowDuplicateSearch] = useState(false);

  

  const handleDealsDeleted = async () => {
    onDealAdded(); // This will trigger a refetch
  };


  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground">Track and move your pipeline from sourcing to close.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutlookCalendarSyncButton 
            variant="ghost" 
            size="sm" 
            showLabel={true} 
          />
          <Button variant="ghost" size="sm" onClick={() => setShowDuplicateSearch(true)}>
            <Search className="h-4 w-4 mr-2" />
            Duplicates
          </Button>
          <CSVImport
            title="Import Deals"
            description="Upload a CSV file to import deals into your pipeline"
            onImport={onCSVImport}
            templateColumns={csvTemplateColumns}
          >
            <Button variant="ghost" size="sm">
              Import
            </Button>
          </CSVImport>
          <ExportData
            data={filteredDeals}
            filename="deals"
            columns={exportColumns}
            loading={loading}
            selectedIds={selectedDeals}
          />
          <AddDealDialog onDealAdded={onDealAdded}>
            <Button size="sm" className="bg-gradient-to-r from-chart-1 to-chart-5 text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Deal
            </Button>
          </AddDealDialog>
        </div>
      </div>

      <BulkDuplicateSearchDialog
        open={showDuplicateSearch}
        onOpenChange={setShowDuplicateSearch}
        deals={allDeals}
        onDealsDeleted={handleDealsDeleted}
      />
    </div>
  );
}
