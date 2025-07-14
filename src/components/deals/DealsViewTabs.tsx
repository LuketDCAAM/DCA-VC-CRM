
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Table, Kanban } from 'lucide-react';
import { ViewMode } from './views/DealsViewRenderer';

interface DealsViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dealCount: number;
}

export function DealsViewTabs({ viewMode, onViewModeChange, dealCount }: DealsViewTabsProps) {
  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="configurable" className="flex items-center gap-2">
          <Table className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </TabsTrigger>
        <TabsTrigger value="grid" className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden sm:inline">Grid</span>
        </TabsTrigger>
        <TabsTrigger value="pipeline" className="flex items-center gap-2">
          <Kanban className="h-4 w-4" />
          <span className="hidden sm:inline">Pipeline</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
