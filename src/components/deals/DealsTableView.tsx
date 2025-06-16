
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
import { Edit, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { Checkbox } from '@/components/ui/checkbox';

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected ? true : (selectedDeals.length > 0 ? 'indeterminate' : false)}
              onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Pipeline Stage</TableHead>
          <TableHead>Round Stage</TableHead>
          <TableHead>Round Size</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Deal Score</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => (
          <TableRow key={deal.id} data-state={selectedDeals.includes(deal.id) ? 'selected' : undefined}>
            <TableCell>
              <Checkbox
                checked={selectedDeals.includes(deal.id)}
                onCheckedChange={() => onToggleDealSelection(deal.id)}
                aria-label={`Select ${deal.company_name}`}
              />
            </TableCell>
            <TableCell>
              <div className="font-medium">{deal.company_name}</div>
              {deal.website && (
                <div className="text-sm text-muted-foreground">{deal.website}</div>
              )}
            </TableCell>
            <TableCell>
              {deal.contact_name ? (
                <div>
                  <div className="font-medium">{deal.contact_name}</div>
                  {deal.contact_email && (
                    <div className="text-sm text-muted-foreground">{deal.contact_email}</div>
                  )}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <Badge variant={getPipelineStageColor(deal.pipeline_stage) as any}>
                {deal.pipeline_stage}
              </Badge>
            </TableCell>
            <TableCell>
              {deal.round_stage ? (
                <Badge variant="outline">{deal.round_stage}</Badge>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>{formatCurrency(deal.round_size)}</TableCell>
            <TableCell>{deal.location || '-'}</TableCell>
            <TableCell>
              {deal.deal_score ? (
                <div className="flex items-center gap-1">
                  <span className="font-medium">{deal.deal_score}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>{deal.deal_source || '-'}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onViewDetails(deal)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
