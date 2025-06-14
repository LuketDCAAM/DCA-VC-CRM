
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Investor } from '@/types/investor';
import { Checkbox } from '@/components/ui/checkbox';

interface InvestorListViewProps {
  investors: Investor[];
  onEdit: (investor: Investor) => void;
  onDelete: (investorId: string) => void;
  selectedInvestors?: string[];
  onToggleInvestorSelection: (investorId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
}

export function InvestorListView({
  investors,
  onEdit,
  onDelete,
  selectedInvestors = [],
  onToggleInvestorSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
}: InvestorListViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected ? true : (selectedInvestors.length > 0 ? 'indeterminate' : false)}
              onCheckedChange={() => isAllSelected ? onDeselectAll() : onSelectAll()}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Firm</TableHead>
          <TableHead>Investment Stage</TableHead>
          <TableHead>Avg. Check Size</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {investors.map((investor) => (
          <TableRow key={investor.id} data-state={selectedInvestors.includes(investor.id) ? 'selected' : undefined}>
            <TableCell>
              <Checkbox
                checked={selectedInvestors.includes(investor.id)}
                onCheckedChange={() => onToggleInvestorSelection(investor.id)}
                aria-label={`Select ${investor.contact_name}`}
              />
            </TableCell>
            <TableCell>
              <div className="font-medium">{investor.contact_name}</div>
              <div className="text-sm text-muted-foreground">{investor.contact_email}</div>
            </TableCell>
            <TableCell>{investor.firm_name || '-'}</TableCell>
            <TableCell>{investor.preferred_investment_stage || '-'}</TableCell>
            <TableCell>
              {investor.average_check_size
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(investor.average_check_size / 100)
                : '-'}
            </TableCell>
            <TableCell>{investor.location || '-'}</TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1">
                    {(investor.tags || []).map(tag => tag && <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onEdit(investor)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(investor.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
