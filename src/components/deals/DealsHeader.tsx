
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Download } from 'lucide-react';
import { DealsStats } from './DealsStats';
import { OutlookCalendarSyncButton } from '@/components/outlook/OutlookCalendarSyncButton';

interface DealsHeaderProps {
  dealStats: {
    total: number;
    active: number;
    inactive: number;
    pipeline: Record<string, number>;
  };
  onAddDeal: () => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
}

export function DealsHeader({ dealStats, onAddDeal, onImportCSV, onExportCSV }: DealsHeaderProps) {
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
            showLabel={false} 
          />
          <Button variant="outline" onClick={onImportCSV}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={onAddDeal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>
      
      <DealsStats stats={dealStats} />
    </div>
  );
}
