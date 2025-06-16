
import React from 'react';
import { TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Mail, DollarSign, MapPin, Calendar } from 'lucide-react';
import { SortableTableHead, SortDirection } from './SortableTableHead';

interface DealsTableHeaderProps {
  isAllSelected: boolean;
  hasSelection: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  sortConfig: { key: string; direction: SortDirection } | null;
  onSort: (key: string) => void;
}

export function DealsTableHeader({
  isAllSelected,
  hasSelection,
  onSelectAll,
  onDeselectAll,
  sortConfig,
  onSort,
}: DealsTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm border-b">
      <TableRow className="hover:bg-transparent">
        <SortableTableHead 
          sortKey="id" 
          currentSort={sortConfig} 
          onSort={() => {}} 
          className="w-12 sticky left-0 z-30 bg-muted/80 backdrop-blur-sm border-r"
        >
          <Checkbox
            checked={isAllSelected ? true : (hasSelection ? 'indeterminate' : false)}
            onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
            aria-label="Select all"
          />
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="company_name" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[280px] sticky left-12 z-30 bg-muted/80 backdrop-blur-sm border-r font-semibold"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Company
          </div>
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="contact_name" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[200px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </div>
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="pipeline_stage" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[150px] font-semibold"
        >
          Pipeline Stage
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="round_stage" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[130px] font-semibold"
        >
          Round Stage
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="round_size" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[120px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Round Size
          </div>
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="location" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[130px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </div>
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="deal_score" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[100px] font-semibold"
        >
          Deal Score
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="deal_source" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[120px] font-semibold"
        >
          Source
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="created_at" 
          currentSort={sortConfig} 
          onSort={onSort}
          className="min-w-[120px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Added
          </div>
        </SortableTableHead>
        
        <SortableTableHead 
          sortKey="actions" 
          currentSort={sortConfig} 
          onSort={() => {}}
          className="text-right min-w-[80px] font-semibold"
        >
          Actions
        </SortableTableHead>
      </TableRow>
    </TableHeader>
  );
}
