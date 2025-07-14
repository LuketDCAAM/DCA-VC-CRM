
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CompanyCell } from './CompanyCell';
import { ContactCell } from './ContactCell';
import { FinancialCell } from './FinancialCell';
import { PipelineStageDropdown } from './PipelineStageDropdown';
import { ExternalDataSyncButton } from '@/components/external-data/ExternalDataSyncButton';
import { formatDate } from './tableUtils';

interface DealsTableRowProps {
  deal: Deal;
  index: number;
  isSelected: boolean;
  onToggleSelection: (dealId: string) => void;
  onViewDetails: (deal: Deal) => void;
  onDealUpdated?: () => void;
}

export function DealsTableRow({
  deal,
  index,
  isSelected,
  onToggleSelection,
  onViewDetails,
  onDealUpdated,
}: DealsTableRowProps) {
  return (
    <TableRow 
      data-state={isSelected ? 'selected' : undefined}
      className={`
        transition-colors duration-150 hover:bg-muted/50 border-b
        ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
        ${isSelected ? 'bg-primary/5 border-primary/20' : ''}
      `}
    >
      <CompanyCell
        deal={deal}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
      />
      
      <ContactCell deal={deal} />
      
      <TableCell>
        <PipelineStageDropdown 
          deal={deal} 
          onUpdate={onDealUpdated}
        />
      </TableCell>
      
      <TableCell>
        {deal.round_stage ? (
          <Badge variant="outline" className="font-medium text-xs">
            {deal.round_stage}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      
      <FinancialCell deal={deal} type="roundSize" />
      
      <TableCell>
        {deal.location ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground text-sm">{deal.location}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      
      <FinancialCell deal={deal} type="dealScore" />
      
      <TableCell>
        {deal.deal_source ? (
          <Badge variant="secondary" className="text-xs">
            {deal.deal_source}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {formatDate(deal.created_at)}
        </div>
        {deal.source_date && deal.source_date !== deal.created_at && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-muted-foreground cursor-help">
                Source: {formatDate(deal.source_date)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Original source date: {formatDate(deal.source_date)}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex items-center gap-1">
          <ExternalDataSyncButton deal={deal} size="sm" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onViewDetails(deal)}
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View deal details</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}
