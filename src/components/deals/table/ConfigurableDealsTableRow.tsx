
import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Deal } from '@/types/deal';
import { useTableColumns } from '@/hooks/deals/useTableColumns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalDataSyncButton } from '@/components/external-data/ExternalDataSyncButton';
import { CompanyCellContent } from './cells/CompanyCellContent';
import { ContactCellContent } from './cells/ContactCellContent';
import { FinancialCellContent } from './cells/FinancialCellContent';
import { StatusCellContent } from './cells/StatusCellContent';
import { BasicCellContent } from './cells/BasicCellContent';

interface ConfigurableDealsTableRowProps {
  deal: Deal;
  index: number;
  isSelected: boolean;
  onToggleSelection: (dealId: string) => void;
  onViewDetails: (deal: Deal) => void;
}

const ConfigurableDealsTableRow = memo(({ 
  deal, 
  index, 
  isSelected, 
  onToggleSelection, 
  onViewDetails 
}: ConfigurableDealsTableRowProps) => {
  const { visibleColumns } = useTableColumns();
  const handleCheckboxChange = () => onToggleSelection(deal.id);
  const handleViewClick = () => onViewDetails(deal);

  const renderCellContent = (columnKey: string) => {
    switch (columnKey) {
      case 'company_name':
        return <CompanyCellContent deal={deal} />;
      
      case 'contact_name':
        return <ContactCellContent deal={deal} />;
      
      case 'pipeline_stage':
        return <StatusCellContent deal={deal} type="pipeline_stage" />;
      
      case 'round_stage':
        return <StatusCellContent deal={deal} type="round_stage" />;
      
      case 'round_size':
        return <FinancialCellContent deal={deal} type="round_size" />;
      
      case 'post_money_valuation':
        return <FinancialCellContent deal={deal} type="post_money_valuation" />;
      
      case 'revenue':
        return <FinancialCellContent deal={deal} type="revenue" />;
      
      case 'location':
        return <BasicCellContent deal={deal} type="location" />;
      
      case 'deal_score':
        return <FinancialCellContent deal={deal} type="deal_score" />;
      
      case 'deal_source':
        return <StatusCellContent deal={deal} type="deal_source" />;
      
      case 'deal_lead':
        return <BasicCellContent deal={deal} type="deal_lead" />;
      
      case 'sector':
        return <StatusCellContent deal={deal} type="sector" />;
      
      case 'created_at':
        return <BasicCellContent deal={deal} type="created_at" />;
      
      case 'source_date':
        return <BasicCellContent deal={deal} type="source_date" />;
      
      case 'description':
        return <BasicCellContent deal={deal} type="description" />;
      
      default:
        return <span className="text-muted-foreground text-sm">-</span>;
    }
  };

  return (
    <TableRow 
      data-state={isSelected ? 'selected' : undefined}
      className={`
        group transition-all duration-200 border-b border-border/40
        ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
        ${isSelected ? 'bg-primary/8 border-primary/30 shadow-sm' : 'hover:bg-muted/50'}
        hover:shadow-sm
      `}
    >
      {/* Selection checkbox */}
      <TableCell className="w-12 sticky left-0 z-10 bg-inherit border-r border-border/30 py-3 px-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          aria-label={`Select ${deal.company_name}`}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </TableCell>
      
      {/* Dynamic columns */}
      {visibleColumns.map((column) => (
        <TableCell 
          key={column.key}
          className={`
            ${column.width} py-3 px-4 align-top
            ${column.key === 'company_name' ? 'sticky left-12 z-10 bg-inherit border-r border-border/30' : ''}
          `}
        >
          {renderCellContent(column.key)}
        </TableCell>
      ))}
      
      {/* Actions */}
      <TableCell className="text-right min-w-[120px] py-3 px-4">
        <div className="flex items-center gap-1">
          <ExternalDataSyncButton deal={deal} size="sm" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewClick}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 opacity-70 group-hover:opacity-100"
              >
                <Eye className="h-3.5 w-3.5" />
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
}, (prevProps, nextProps) => {
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.deal.updated_at === nextProps.deal.updated_at &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.index === nextProps.index
  );
});

ConfigurableDealsTableRow.displayName = 'ConfigurableDealsTableRow';

export { ConfigurableDealsTableRow };
