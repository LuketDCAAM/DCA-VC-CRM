
import React from 'react';
import { MapPin, User, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Deal } from '@/types/deal';
import { formatLocation } from '@/utils/locationUtils';

interface BasicCellContentProps {
  deal: Deal;
  type: 'location' | 'deal_lead' | 'created_at' | 'source_date' | 'description' | 'last_call_date' | 'total_calls' | 'investment_vehicle';
}

export function BasicCellContent({ deal, type }: BasicCellContentProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  switch (type) {
    case 'location':
      return deal.location ? (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground text-sm">{formatLocation(deal.location)}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'deal_lead':
      return deal.deal_lead ? (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground text-sm">{deal.deal_lead}</span>
        </div>
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

    case 'last_call_date':
      return deal.last_call_date ? (
        <div className="text-sm text-foreground">
          {formatDate(deal.last_call_date)}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'total_calls':
      return (
        <div className="text-sm font-medium text-foreground">
          {deal.total_calls || 0}
        </div>
      );

    case 'description':
      return deal.description ? (
        <div className="flex items-start gap-1">
          <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
          <span className="text-foreground text-sm line-clamp-2 max-w-[180px]">
            {deal.description}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    case 'investment_vehicle':
      return deal.investment_vehicle ? (
        <Badge variant="secondary" className="text-xs">
          {deal.investment_vehicle}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );

    default:
      return <span className="text-muted-foreground text-sm">-</span>;
  }
}
