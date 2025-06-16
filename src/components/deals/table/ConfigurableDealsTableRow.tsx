
import React, { memo } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, MapPin, Mail, Phone, Globe, Star, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Deal } from '@/types/deal';
import { formatCurrency, formatDate, getPipelineStageColor, getDealScoreColor } from './tableUtils';
import { useTableColumns } from '@/hooks/deals/useTableColumns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
          <div className="space-y-1 py-1">
            <div className="font-semibold text-sm text-foreground leading-tight">{deal.company_name}</div>
            {deal.website && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                    <Globe className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[180px]">{deal.website}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <p>{deal.website}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {deal.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] cursor-help">
                    {deal.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                  <p className="whitespace-normal">{deal.description}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      
      case 'contact_name':
        return deal.contact_name ? (
          <div className="space-y-1 py-1">
            <div className="font-medium text-sm text-foreground leading-tight">{deal.contact_name}</div>
            {deal.contact_email && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[140px]">{deal.contact_email}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <p>{deal.contact_email}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {deal.contact_phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{deal.contact_phone}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'pipeline_stage':
        return (
          <Badge className={`text-xs font-medium px-2.5 py-1 ${getPipelineStageColor(deal.pipeline_stage)}`}>
            {deal.pipeline_stage}
          </Badge>
        );
      
      case 'round_stage':
        return deal.round_stage ? (
          <Badge variant="outline" className="font-medium text-xs px-2.5 py-1 border-muted-foreground/30">
            {deal.round_stage}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'round_size':
        return (
          <div className="space-y-0.5">
            <div className="font-semibold text-sm text-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              {formatCurrency(deal.round_size)}
            </div>
            {deal.post_money_valuation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-muted-foreground cursor-help">
                    Val: {formatCurrency(deal.post_money_valuation)}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Post-money valuation</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      
      case 'post_money_valuation':
        return (
          <div className="font-semibold text-sm text-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            {formatCurrency(deal.post_money_valuation)}
          </div>
        );
      
      case 'revenue':
        return (
          <div className="font-semibold text-sm text-foreground flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            {formatCurrency(deal.revenue)}
          </div>
        );
      
      case 'location':
        return deal.location ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">{deal.location}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'deal_score':
        return deal.deal_score ? (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className={`font-bold text-base ${getDealScoreColor(deal.deal_score)}`}>
              {deal.deal_score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'deal_source':
        return deal.deal_source ? (
          <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1">
            {deal.deal_source}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'deal_lead':
        return deal.deal_lead ? (
          <span className="text-sm text-foreground font-medium">{deal.deal_lead}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'sector':
        return deal.sector ? (
          <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 border-muted-foreground/30">
            {deal.sector}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'created_at':
        return (
          <div className="text-xs text-muted-foreground font-medium">
            {formatDate(deal.created_at)}
          </div>
        );
      
      case 'source_date':
        return deal.source_date ? (
          <div className="text-xs text-muted-foreground font-medium">
            {formatDate(deal.source_date)}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      
      case 'description':
        return deal.description ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px] cursor-help">
                {deal.description}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <p className="whitespace-normal">{deal.description}</p>
            </TooltipContent>
          </Tooltip>
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
      <TableCell className="text-right min-w-[80px] py-3 px-4">
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
