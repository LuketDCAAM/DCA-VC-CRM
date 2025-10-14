import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Calendar, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CompanyCell } from './CompanyCell';
import { ContactCell } from './ContactCell';
import { FinancialCell } from './FinancialCell';
import { PipelineStageDropdown } from './PipelineStageDropdown';
import { ExternalDataSyncButton } from '@/components/external-data/ExternalDataSyncButton';
import { formatDate } from './tableUtils';
import { useDeleteDeal } from '@/hooks/useDeleteDeal';
import { formatLocation } from '@/utils/locationUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
  const { deleteDeal, isDeleting } = useDeleteDeal();

  const handleDelete = async () => {
    const success = await deleteDeal(deal.id);
    if (success && onDealUpdated) {
      onDealUpdated();
    }
  };

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
        {(deal.city || deal.state_province || deal.country) ? (
          <div className="flex flex-col gap-0.5">
            {deal.city && <div className="text-sm font-medium">{deal.city}</div>}
            {deal.state_province && <div className="text-xs text-muted-foreground">{deal.state_province}</div>}
            {deal.country && <div className="text-xs text-muted-foreground">{deal.country}</div>}
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
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deal.company_name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}