
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Edit, Eye, Globe, Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DealsTableViewProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection: (dealId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

const getPipelineStageColor = (stage: string) => {
  const colors = {
    'Seen Not Reviewed': 'secondary',
    'Initial Review': 'secondary',
    'Initial Contact': 'default',
    'First Meeting': 'default',
    'Due Diligence': 'default',
    'Term Sheet': 'default',
    'Legal Review': 'default',
    'Invested': 'default',
    'Passed': 'destructive',
  };
  return colors[stage as keyof typeof colors] || 'secondary';
};

const getDealScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 font-semibold';
  if (score >= 60) return 'text-yellow-600 font-semibold';
  if (score >= 40) return 'text-orange-600 font-semibold';
  return 'text-red-600 font-semibold';
};

export function DealsTableView({
  deals,
  onViewDetails,
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
}: DealsTableViewProps) {
  return (
    <TooltipProvider>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 sticky left-0 z-30 bg-muted/80 backdrop-blur-sm border-r">
                  <Checkbox
                    checked={isAllSelected ? true : (selectedDeals.length > 0 ? 'indeterminate' : false)}
                    onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="min-w-[280px] sticky left-12 z-30 bg-muted/80 backdrop-blur-sm border-r font-semibold">
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
                <TableHead className="min-w-[150px] font-semibold">Pipeline Stage</TableHead>
                <TableHead className="min-w-[130px] font-semibold">Round Stage</TableHead>
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
                <TableHead className="min-w-[100px] font-semibold">Deal Score</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Source</TableHead>
                <TableHead className="min-w-[120px] font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Added
                  </div>
                </TableHead>
                <TableHead className="text-right min-w-[80px] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal, index) => (
                <TableRow 
                  key={deal.id} 
                  data-state={selectedDeals.includes(deal.id) ? 'selected' : undefined}
                  className={`
                    transition-colors duration-150 hover:bg-muted/50 border-b
                    ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    ${selectedDeals.includes(deal.id) ? 'bg-primary/5 border-primary/20' : ''}
                  `}
                >
                  <TableCell className="sticky left-0 z-10 bg-inherit border-r">
                    <Checkbox
                      checked={selectedDeals.includes(deal.id)}
                      onCheckedChange={() => onToggleDealSelection(deal.id)}
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
                  <TableCell>
                    {deal.contact_name ? (
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{deal.contact_name}</div>
                        {deal.contact_email && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{deal.contact_email}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{deal.contact_email}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {deal.contact_phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{deal.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getPipelineStageColor(deal.pipeline_stage) as any}
                      className="font-medium"
                    >
                      {deal.pipeline_stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deal.round_stage ? (
                      <Badge variant="outline" className="font-medium">
                        {deal.round_stage}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
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
                          <p>Post-money valuation: {formatCurrency(deal.post_money_valuation)}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{deal.location}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.deal_score ? (
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-lg ${getDealScoreColor(deal.deal_score)}`}>
                          {deal.deal_score}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {deal.deal_source ? (
                      <Badge variant="secondary" className="text-xs">
                        {deal.deal_source}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onViewDetails(deal)}
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View deal details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
