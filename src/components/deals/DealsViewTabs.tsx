
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Grid3X3, Table, Kanban, Settings, Zap, Layers } from 'lucide-react';
import { ViewMode } from './DealsPageContent';

interface DealsViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  dealCount: number;
}

export function DealsViewTabs({ viewMode, onViewModeChange, dealCount }: DealsViewTabsProps) {
  return (
    <div className="flex items-center justify-between">
      <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as ViewMode)}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="configurable" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurable</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </TabsTrigger>
          <TabsTrigger value="high-performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Fast Table</span>
          </TabsTrigger>
          <TabsTrigger value="virtualized" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Virtual</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="text-sm text-muted-foreground">
        {dealCount} deals
      </div>
    </div>
  );
}
