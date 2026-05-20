import React, { useState, useMemo, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, Eye, Calendar, Star, FileText } from 'lucide-react';
import { Deal } from '@/types/deal';
import { PIPELINE_STAGES, PipelineStage } from '@/hooks/deals/dealStagesConfig';
import { getPipelineStageBackground, getPipelineStageBorder } from './pipelineStageColors';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COLUMN_PAGE_SIZE = 50;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return currencyFormatter.format(amount / 100);
};

interface DealCardMiniProps {
  deal: Deal;
  index: number;
  isUpdating: boolean;
  onViewDetails?: (deal: Deal) => void;
}

const DealCardMini = memo(function DealCardMini({
  deal,
  index,
  isUpdating,
  onViewDetails,
}: DealCardMiniProps) {
  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? 'rotate-2 scale-105' : ''} transition-transform`}
        >
          <Card
            className={`hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing bg-card border border-border
              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50' : ''}
              ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <CardHeader className="pb-1 px-3 pt-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xs font-semibold flex items-center gap-1 text-card-foreground">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{deal.company_name}</span>
                </CardTitle>
                {onViewDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0.5 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(deal);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-2 space-y-1">
              <div className="flex items-center justify-between">
                {deal.round_stage && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {deal.round_stage}
                  </Badge>
                )}
                {typeof deal.deal_score === 'number' && (
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground font-medium">
                    <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs">{deal.deal_score}</span>
                  </div>
                )}
              </div>

              {deal.round_size && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="h-2.5 w-2.5 text-green-600" />
                  <span className="font-medium">{formatCurrency(deal.round_size)}</span>
                </div>
              )}

              {deal.next_steps && (
                <div className="flex items-start gap-1 p-1.5 bg-accent rounded text-xs">
                  <FileText className="h-2.5 w-2.5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-accent-foreground font-medium text-xs">Next Steps</p>
                    <p className="text-accent-foreground text-xs line-clamp-2 break-words">{deal.next_steps}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                <span>{new Date(deal.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
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

          return (
            <div key={stage} className="flex-shrink-0 w-64">
              <Card className={`h-full ${getPipelineStageBackground(stage)} ${getPipelineStageBorder(stage)} shadow-sm border`}>
                <CardHeader className="pb-2 px-3 pt-3">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-950">
                    <span className="truncate">{stage}</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {stageDeals.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
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
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
});
