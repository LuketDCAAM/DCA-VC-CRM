
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, RotateCcw, Info } from 'lucide-react';
import { MultiSortConfig } from '@/hooks/deals/useAdvancedTableSorting';

interface SortControlsProps {
  sortConfigs: MultiSortConfig;
  onRemoveSort: (key: string) => void;
  onClearSort: () => void;
}

const COLUMN_LABELS: Record<string, string> = {
  company_name: 'Company',
  contact_name: 'Contact',
  pipeline_stage: 'Pipeline Stage',
  round_stage: 'Round Stage',
  round_size: 'Round Size',
  location: 'Location',
  deal_score: 'Deal Score',
  deal_source: 'Source',
  created_at: 'Date Added',
  post_money_valuation: 'Valuation',
  revenue: 'Revenue',
  source_date: 'Source Date',
};

export function SortControls({ sortConfigs, onRemoveSort, onClearSort }: SortControlsProps) {
  if (sortConfigs.length === 0) return null;

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Sorted by:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {sortConfigs.map((config, index) => (
                <Badge
                  key={config.key}
                  variant="secondary"
                  className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  <span className="text-xs font-medium">{index + 1}.</span>
                  <span>{COLUMN_LABELS[config.key] || config.key}</span>
                  <span className="text-xs">
                    ({config.direction === 'asc' ? '↑' : '↓'})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive ml-1"
                    onClick={() => onRemoveSort(config.key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSort}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          <span>💡 Tip: Hold Ctrl/Cmd while clicking column headers to sort by multiple columns</span>
        </div>
      </CardContent>
    </Card>
  );
}
