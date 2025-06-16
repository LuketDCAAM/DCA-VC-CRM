
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Deal } from '@/types/deal';

interface CompanyCellProps {
  deal: Deal;
  isSelected: boolean;
  onToggleSelection: (dealId: string) => void;
  isSticky?: boolean;
}

export function CompanyCell({ deal, isSelected, onToggleSelection, isSticky }: CompanyCellProps) {
  return (
    <>
      <TableCell className="sticky left-0 z-10 bg-inherit border-r">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(deal.id)}
          aria-label={`Select ${deal.company_name}`}
        />
      </TableCell>
      <TableCell className="sticky left-12 z-10 bg-inherit border-r">
        <div className="space-y-1">
          <div className="font-semibold text-foreground">{deal.company_name}</div>
          {deal.website && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer">
                  <Globe className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{deal.website}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{deal.website}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {deal.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground line-clamp-2 max-w-[250px] cursor-help">
                  {deal.description}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{deal.description}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </>
  );
}
