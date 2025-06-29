
import React from 'react';
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Mail, DollarSign, MapPin, Calendar } from 'lucide-react';

interface SimpleDealsTableHeaderProps {
  isAllSelected: boolean;
  hasSelection: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SimpleDealsTableHeader({
  isAllSelected,
  hasSelection,
  onSelectAll,
  onDeselectAll,
}: SimpleDealsTableHeaderProps) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-background border-b">
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-12">
          <Checkbox
            checked={isAllSelected ? true : (hasSelection ? 'indeterminate' : false)}
            onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
            aria-label="Select all"
          />
        </TableHead>
        
        <TableHead className="min-w-[280px] font-semibold">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Company
          </div>
        </TableHead>
        
        <TableHead className="min-w-[200px] font-semibold">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </div>
        </TableHead>
        
        <TableHead className="min-w-[150px] font-semibold">
          Pipeline Stage
        </TableHead>
        
        <TableHead className="min-w-[130px] font-semibold">
          Round Stage
        </TableHead>
        
        <TableHead className="min-w-[120px] font-semibold">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Round Size
          </div>
        </TableHead>
        
        <TableHead className="min-w-[130px] font-semibold">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </div>
        </TableHead>
        
        <TableHead className="min-w-[100px] font-semibold">
          Deal Score
        </TableHead>
        
        <TableHead className="min-w-[120px] font-semibold">
          Source
        </TableHead>
        
        <TableHead className="min-w-[120px] font-semibold">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Added
          </div>
        </TableHead>
        
        <TableHead className="text-right min-w-[80px] font-semibold">
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
