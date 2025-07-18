
import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Mail, Phone } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Deal } from '@/types/deal';

interface ContactCellProps {
  deal: Deal;
}

export function ContactCell({ deal }: ContactCellProps) {
  return (
    <TableCell>
      {deal.contact_name ? (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{deal.contact_name}</div>
          {deal.contact_email && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={`mailto:${deal.contact_email}`}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                >
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{deal.contact_email}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{deal.contact_email}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {deal.contact_phone && (
            <a
              href={`tel:${deal.contact_phone}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span>{deal.contact_phone}</span>
            </a>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )}
    </TableCell>
  );
}
