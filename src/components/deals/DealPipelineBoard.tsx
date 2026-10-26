import React, { useState, useMemo, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Deal } from '@/types/deal';
import { PIPELINE_STAGES, PipelineStage } from '@/hooks/deals/dealStagesConfig';
import { getDealSectors } from '@/utils/sectorUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


const COLUMN_PAGE_SIZE = 50;

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatCompact = (amount: number | null) => (amount ? compactMoney.format(amount / 100) : null);

const scoreClass = (score: number) =>
  score >= 80
    ? 'border-chart-1 text-chart-1'
    : score >= 60
    ? 'border-chart-3 text-chart-3'
    : 'border-muted-foreground/40 text-muted-foreground';

const relativeDays = (date: string) => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

interface DealCardMiniProps {
  deal: Deal;
  index: number;
  isUpdating: boolean;
  onViewDetails?: (deal: Deal) => void;
}

const DealCardMini = memo(function DealCardMini({ deal, index, isUpdating, onViewDetails }: DealCardMiniProps) {
  const sectors = getDealSectors(deal).slice(0, 2);
  const size = formatCompact(deal.round_size);
  const owner = (deal as any).sourced_by as string | null;
  const score = typeof deal.deal_score === 'number' && deal.deal_score > 0 ? deal.deal_score : null;

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onDoubleClick={() => onViewDetails?.(deal)}
          className={cn(
            'group mb-2 rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing',
            snapshot.isDragging && 'shadow-lg ring-2 ring-primary/40',
            isUpdating && 'opacity-50 pointer-events-none'
          )}
        >
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-chart-1 to-chart-5 text-xs font-semibold text-primary-foreground">
              {initials(deal.company_name || '?')}
            </div>
            <div className="min-w-0 flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate text-sm font-semibold leading-tight">{deal.company_name}</div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                  <p className="whitespace-normal">{deal.company_name}</p>
                </TooltipContent>
              </Tooltip>
              {deal.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate text-xs text-muted-foreground">{deal.description}</div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                    <p className="whitespace-normal">{deal.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}

            </div>
            {onViewDetails && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                aria-label={`Open ${deal.company_name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(deal);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {sectors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {sectors.map((s) => (
                <Badge key={s} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {[size, deal.round_stage].filter(Boolean).join(' ') || <span className="text-muted-foreground">No round info</span>}
            </span>
            {score != null && (
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold', scoreClass(score))}>
                {score}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 truncate">
              {owner && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-foreground">
                  {initials(owner)}
                </span>
              )}
              <span className="truncate">{owner || 'Unassigned'}</span>
            </span>
            <span className="flex-shrink-0">{relativeDays(deal.updated_at)}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
});

interface DealPipelineBoardProps {
  deals: Deal[];
  onViewDetails?: (deal: Deal) => void;
  onDealUpdated?: () => void;
}

export const DealPipelineBoard = memo(function DealPipelineBoard({
  deals,
  onViewDetails,
  onDealUpdated,
}: DealPipelineBoardProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({});

  const dealsByStage = useMemo(() => {
    const acc: Record<PipelineStage, Deal[]> = {} as Record<PipelineStage, Deal[]>;
    for (const stage of PIPELINE_STAGES) acc[stage] = [];
    for (const deal of deals) {
      const stage = deal.pipeline_stage as PipelineStage;
      if (acc[stage]) acc[stage].push(deal);
    }
    return acc;
  }, [deals]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
        return;
      }
      const dealId = draggableId;
      const newStage = destination.droppableId as PipelineStage;
      setUpdatingId(dealId);
      try {
        const { error } = await supabase
          .from('deals')
          .update({ pipeline_stage: newStage as any, updated_at: new Date().toISOString() })
          .eq('id', dealId);
        if (error) throw error;
        toast.success(`Deal moved to ${newStage}`);
        onDealUpdated?.();
      } catch (error) {
        console.error('Error updating pipeline stage:', error);
        toast.error('Failed to update pipeline stage');
      } finally {
        setUpdatingId(null);
      }
    },
    [onDealUpdated]
  );

  const showMore = useCallback((stage: string) => {
    setVisibleCount((prev) => ({
      ...prev,
      [stage]: (prev[stage] ?? COLUMN_PAGE_SIZE) + COLUMN_PAGE_SIZE,
    }));
  }, []);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage];
          const limit = visibleCount[stage] ?? COLUMN_PAGE_SIZE;
          const visible = stageDeals.slice(0, limit);
          const hiddenCount = stageDeals.length - visible.length;
          const stageTotal = stageDeals.reduce((s, d) => s + (d.round_size ?? 0), 0);

          return (
            <div key={stage} className="flex-shrink-0 w-72">
              <div className="h-full overflow-hidden rounded-xl border bg-muted/40">
                <div className="h-1 bg-gradient-to-r from-chart-1 to-chart-5" />
                <div className="px-3 pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold">{stage}</span>
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">{stageDeals.length}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stageTotal ? `${compactMoney.format(stageTotal / 100)} total round size` : 'No round sizes'}
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-1 min-h-[200px] max-h-[70vh] overflow-y-auto
                          ${snapshot.isDraggingOver ? 'bg-primary/5 rounded-md border-2 border-dashed border-primary/30' : ''}`}
                      >
                        {visible.length > 0 ? (
                          visible.map((deal, index) => (
                            <DealCardMini
                              key={deal.id}
                              deal={deal}
                              index={index}
                              isUpdating={updatingId === deal.id}
                              onViewDetails={onViewDetails}
                            />
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground text-xs">
                            {snapshot.isDraggingOver ? 'Drop here to move to this stage' : 'No deals in this stage'}
                          </div>
                        )}
                        {provided.placeholder}
                        {hiddenCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs h-7 mt-1"
                            onClick={() => showMore(stage)}
                          >
                            Show {Math.min(hiddenCount, COLUMN_PAGE_SIZE)} more ({hiddenCount} hidden)
                          </Button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
});
