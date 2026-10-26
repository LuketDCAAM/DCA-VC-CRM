
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
    <div className="flex min-w-0 max-w-[220px] items-center gap-1.5">
      <span className="min-w-0 truncate text-sm font-medium leading-none text-foreground">
        {deal.contact_name}
      </span>

      {deal.contact_email && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`mailto:${deal.contact_email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-primary"
              aria-label={`Email ${deal.contact_email}`}
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-[320px]">
            <p className="whitespace-normal break-all">{deal.contact_email}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {deal.contact_phone && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={`tel:${deal.contact_phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-primary"
              aria-label={`Call ${deal.contact_phone}`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <p className="whitespace-normal">{deal.contact_phone}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
