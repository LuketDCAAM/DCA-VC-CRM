import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PerformanceStatus } from '@/lib/portfolio/metrics';

const STYLES: Record<PerformanceStatus, string> = {
  'On Track': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  Watch: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'At Risk': 'bg-destructive/15 text-destructive border-destructive/30',
  Unknown: 'bg-muted text-muted-foreground border-border',
};

interface Props {
  status: PerformanceStatus;
  reasons?: string[];
  overridden?: boolean;
}

export function PerformanceStatusBadge({ status, reasons = [], overridden }: Props) {
  const badge = (
    <Badge variant="outline" className={`${STYLES[status]} font-medium`}>
      {status}
      {overridden ? ' *' : ''}
    </Badge>
  );

  if (!reasons.length && !overridden) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{badge}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {overridden && <p className="font-medium mb-1">Manually set</p>}
          <ul className="list-disc pl-4 space-y-0.5">
            {reasons.map((r) => (
              <li key={r} className="text-xs">
                {r}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
