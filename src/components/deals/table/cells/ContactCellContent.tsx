
import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ContactCellContentProps {
  deal: Deal;
}

export function ContactCellContent({ deal }: ContactCellContentProps) {
  if (!deal.contact_name) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
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
  );
}
