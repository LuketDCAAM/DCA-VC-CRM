import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Search, GripVertical } from 'lucide-react';
import { Deal } from '@/types/deal';
import { useDeals } from '@/hooks/useDeals';
import { usePriorityDeals } from '@/hooks/usePriorityDeals';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface PriorityDealsManagementDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PriorityDealsManagementDialog({ open, onClose }: PriorityDealsManagementDialogProps) {
  const { deals } = useDeals();
  const { priorityDeals, togglePriorityStatus, updatePriorityRankings, isUpdating } = usePriorityDeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [localPriorityDeals, setLocalPriorityDeals] = useState<Deal[]>([]);

  React.useEffect(() => {
    setLocalPriorityDeals([...priorityDeals]);
  }, [priorityDeals]);

  const activeDeals = deals?.filter(deal => 
    deal.pipeline_stage !== 'Passed' && 
    deal.pipeline_stage !== 'Invested' &&
    deal.pipeline_stage !== 'Inactive'
  ) || [];

  const filteredDeals = activeDeals.filter(deal =>
    deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.pipeline_stage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nonPriorityDeals = filteredDeals.filter(deal =>
    !localPriorityDeals.some(pd => pd.id === deal.id)
  );

  const handleTogglePriority = async (deal: Deal, isPriority: boolean) => {
    if (isPriority && localPriorityDeals.length >= 10) {
      return; // Prevent adding more than 10
    }

    await togglePriorityStatus.mutateAsync({ dealId: deal.id, isPriority });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localPriorityDeals);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLocalPriorityDeals(items);
  };

  const handleSaveRankings = async () => {
    const rankings = localPriorityDeals.map((deal, index) => ({
      id: deal.id,
      priority_rank: index + 1
    }));

    await updatePriorityRankings.mutateAsync(rankings);
    onClose();
  };

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'Initial Outreach': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'First Meeting': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Due Diligence': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Term Sheet': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Negotiation': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Manage Priority Deals
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Priority Deals List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Priority Deals ({localPriorityDeals.length}/10)</h3>
              {localPriorityDeals.length > 0 && (
                <Button 
                  onClick={handleSaveRankings}
                  disabled={isUpdating}
                  size="sm"
                >
                  Save Rankings
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {localPriorityDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No priority deals selected</p>
                  <p className="text-sm">Select deals from the list on the right</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="priority-deals">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {localPriorityDeals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground min-w-[24px]">
                                  #{index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{deal.company_name}</h4>
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getStageColor(deal.pipeline_stage)}`}
                                  >
                                    {deal.pipeline_stage}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTogglePriority(deal, false)}
                                  disabled={isUpdating}
                                  className="text-destructive hover:text-destructive"
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </ScrollArea>
          </div>

          {/* Available Deals */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Available Active Deals</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {nonPriorityDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No available deals found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search term</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {nonPriorityDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={(checked) => 
                          handleTogglePriority(deal, !!checked)
                        }
                        disabled={isUpdating || localPriorityDeals.length >= 10}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{deal.company_name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStageColor(deal.pipeline_stage)}`}
                          >
                            {deal.pipeline_stage}
                          </Badge>
                          {deal.deal_score && (
                            <Badge variant="outline" className="text-xs">
                              Score: {deal.deal_score}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveRankings} disabled={isUpdating}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}