
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DealsStats } from './DealsStats';
import { OutlookCalendarSyncButton } from '@/components/outlook/OutlookCalendarSyncButton';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';

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

  const handleAddDeal = () => {
    onDealAdded();
  };

  const handleImportCSV = () => {
    // CSV import logic will be handled by the parent component
  };

  const handleExportCSV = () => {
    // CSV export logic will be handled by the parent component
  };

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
          {/* Always show the sync button for debugging */}
          <OutlookCalendarSyncButton 
            variant="outline" 
            size="default" 
            showLabel={true} 
          />
          <Button variant="outline" onClick={handleImportCSV}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddDeal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>
    </div>
  );
}
