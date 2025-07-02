
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, FileText } from 'lucide-react';
import { Deal } from '@/types/deal';
import { formatDate } from '@/lib/utils';

interface DealCardContentProps {
  deal: Deal;
}

export function DealCardContent({ deal }: DealCardContentProps) {
  return (
    <div className="space-y-2">
      {deal.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {deal.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {deal.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{deal.location}</span>
          </div>
        )}
        
        {deal.sector && (
          <Badge variant="outline" className="text-xs">
            {deal.sector}
          </Badge>
        )}
        
        {deal.deal_source && (
          <Badge variant="secondary" className="text-xs">
            {deal.deal_source}
          </Badge>
        )}
      </div>

      {deal.next_steps && (
        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-md border-l-2 border-blue-200">
          <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-800">Next Steps</p>
            <p className="text-xs text-blue-700 line-clamp-2">{deal.next_steps}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>Created {formatDate(deal.created_at)}</span>
        {deal.deal_lead && (
          <>
            <Users className="h-3 w-3 ml-2" />
            <span>{deal.deal_lead}</span>
          </>
        )}
      </div>
    </div>
  );
}
