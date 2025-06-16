
import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Mail, Phone, Globe, Star, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Deal } from '@/types/deal';
import { formatCurrency, formatDate, getPipelineStageColor, getDealScoreColor } from './tableUtils';
import { useTableColumns } from '@/hooks/deals/useTableColumns';

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
        return (
          <div className="space-y-1">
            <div className="font-semibold text-foreground">{deal.company_name}</div>
            {deal.website && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{deal.website}</span>
              </div>
            )}
            {deal.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[250px]">
                {deal.description}
              </p>
            )}
          </div>
        );
      
      case 'contact_name':
        return deal.contact_name ? (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{deal.contact_name}</div>
            {deal.contact_email && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{deal.contact_email}</span>
              </div>
            )}
            {deal.contact_phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{deal.contact_phone}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'pipeline_stage':
        return (
          <Badge className={getPipelineStageColor(deal.pipeline_stage)}>
            {deal.pipeline_stage}
          </Badge>
        );
      
      case 'round_stage':
        return deal.round_stage ? (
          <Badge variant="outline" className="font-medium text-xs">
            {deal.round_stage}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'round_size':
        return (
          <div>
            <div className="font-medium text-foreground">
              {formatCurrency(deal.round_size)}
            </div>
            {deal.post_money_valuation && (
              <div className="text-xs text-muted-foreground">
                Val: {formatCurrency(deal.post_money_valuation)}
              </div>
            )}
          </div>
        );
      
      case 'post_money_valuation':
        return (
          <div className="font-medium text-foreground">
            {formatCurrency(deal.post_money_valuation)}
          </div>
        );
      
      case 'revenue':
        return (
          <div className="font-medium text-foreground">
            {formatCurrency(deal.revenue)}
          </div>
        );
      
      case 'location':
        return deal.location ? (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground text-sm">{deal.location}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'deal_score':
        return deal.deal_score ? (
          <div className="flex items-center gap-1">
            <span className={`font-bold text-lg ${getDealScoreColor(deal.deal_score)}`}>
              {deal.deal_score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      
      case 'deal_source':
        return deal.deal_source ? (
          <Badge variant="secondary" className="text-xs">
            {deal.deal_source}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'deal_lead':
        return deal.deal_lead ? (
          <span className="text-foreground text-sm">{deal.deal_lead}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'sector':
        return deal.sector ? (
          <Badge variant="outline" className="text-xs">
            {deal.sector}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'created_at':
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(deal.created_at)}
          </div>
        );
      
      case 'source_date':
        return deal.source_date ? (
          <div className="text-sm text-muted-foreground">
            {formatDate(deal.source_date)}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'description':
        return deal.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3 max-w-[200px]">
            {deal.description}
          </p>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      default:
        return <span className="text-muted-foreground text-sm">-</span>;
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
      {/* Selection checkbox */}
      <TableCell className="w-12 sticky left-0 z-10 bg-inherit">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          aria-label={`Select ${deal.company_name}`}
        />
      </TableCell>
      
      {/* Dynamic columns */}
      {visibleColumns.map((column) => (
        <TableCell 
          key={column.key}
          className={`
            ${column.width}
            ${column.key === 'company_name' ? 'sticky left-12 z-10 bg-inherit border-r' : ''}
          `}
        >
          {renderCellContent(column.key)}
        </TableCell>
      ))}
      
      {/* Actions */}
      <TableCell className="text-right min-w-[80px]">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleViewClick}
          className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Eye className="h-3 w-3" />
        </Button>
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
