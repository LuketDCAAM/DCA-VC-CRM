
import React from 'react';
import { Globe, Linkedin } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CompanyCellContentProps {
  deal: Deal;
}

const toHref = (url: string) =>
  url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

export function CompanyCellContent({ deal }: CompanyCellContentProps) {
  return (
    <div className="flex min-w-0 max-w-[260px] items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="min-w-0 cursor-help truncate text-sm font-semibold leading-none text-foreground">
            {deal.company_name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[320px]">
          <p className="font-semibold">{deal.company_name}</p>
          {deal.description && (
            <p className="mt-1 whitespace-normal text-xs text-muted-foreground">{deal.description}</p>
          )}
          {deal.website && (
            <p className="mt-1 whitespace-normal break-all text-xs">{deal.website}</p>
          )}
          {deal.linkedin_url && (
            <p className="whitespace-normal break-all text-xs">{deal.linkedin_url}</p>
          )}
        </TooltipContent>
      </Tooltip>

      {deal.website && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={toHref(deal.website)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-primary"
              aria-label={`Open ${deal.company_name} website`}
            >
              <Globe className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-[320px]">
            <p className="whitespace-normal break-all">{deal.website}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {deal.linkedin_url && (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={toHref(deal.linkedin_url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 text-muted-foreground transition-colors hover:text-primary"
              aria-label={`Open ${deal.company_name} on LinkedIn`}
            >
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="max-w-[320px]">
            <p className="whitespace-normal break-all">{deal.linkedin_url}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
