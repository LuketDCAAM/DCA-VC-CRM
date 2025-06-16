
import React from 'react';
import { TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Mail, DollarSign, MapPin, Calendar } from 'lucide-react';
import { AdvancedSortableTableHead } from './AdvancedSortableTableHead';
import { MultiSortConfig } from '@/hooks/deals/useAdvancedTableSorting';

interface DealsTableHeaderProps {
  isAllSelected: boolean;
  hasSelection: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  sortConfigs: MultiSortConfig;
  onSort: (key: string, isMultiSort?: boolean) => void;
  onRemoveSort: (key: string) => void;
  getSortForColumn: (key: string) => { key: string; direction: 'asc' | 'desc' | null } | null;
  getSortPriority: (key: string) => number | null;
}

export function DealsTableHeader({
  isAllSelected,
  hasSelection,
  onSelectAll,
  onDeselectAll,
  sortConfigs,
  onSort,
  onRemoveSort,
  getSortForColumn,
  getSortPriority,
}: DealsTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm border-b">
      <TableRow className="hover:bg-transparent">
        <AdvancedSortableTableHead 
          sortKey="id" 
          currentSort={null}
          sortPriority={null}
          onSort={() => {}}
          canSort={false}
          className="w-12 sticky left-0 z-30 bg-muted/80 backdrop-blur-sm border-r"
        >
          <Checkbox
            checked={isAllSelected ? true : (hasSelection ? 'indeterminate' : false)}
            onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
            aria-label="Select all"
          />
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="company_name" 
          currentSort={getSortForColumn('company_name')}
          sortPriority={getSortPriority('company_name')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[280px] sticky left-12 z-30 bg-muted/80 backdrop-blur-sm border-r font-semibold"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Company
          </div>
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="contact_name" 
          currentSort={getSortForColumn('contact_name')}
          sortPriority={getSortPriority('contact_name')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[200px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </div>
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="pipeline_stage" 
          currentSort={getSortForColumn('pipeline_stage')}
          sortPriority={getSortPriority('pipeline_stage')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[150px] font-semibold"
        >
          Pipeline Stage
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="round_stage" 
          currentSort={getSortForColumn('round_stage')}
          sortPriority={getSortPriority('round_stage')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[130px] font-semibold"
        >
          Round Stage
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="round_size" 
          currentSort={getSortForColumn('round_size')}
          sortPriority={getSortPriority('round_size')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[120px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Round Size
          </div>
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="location" 
          currentSort={getSortForColumn('location')}
          sortPriority={getSortPriority('location')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[130px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </div>
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="deal_score" 
          currentSort={getSortForColumn('deal_score')}
          sortPriority={getSortPriority('deal_score')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[100px] font-semibold"
        >
          Deal Score
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="deal_source" 
          currentSort={getSortForColumn('deal_source')}
          sortPriority={getSortPriority('deal_source')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[120px] font-semibold"
        >
          Source
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="created_at" 
          currentSort={getSortForColumn('created_at')}
          sortPriority={getSortPriority('created_at')}
          onSort={onSort}
          onRemoveSort={onRemoveSort}
          className="min-w-[120px] font-semibold"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Added
          </div>
        </AdvancedSortableTableHead>
        
        <AdvancedSortableTableHead 
          sortKey="actions" 
          currentSort={null}
          sortPriority={null}
          onSort={() => {}}
          canSort={false}
          className="text-right min-w-[80px] font-semibold"
        >
          Actions
        </AdvancedSortableTableHead>
      </TableRow>
    </TableHeader>
  );
}
