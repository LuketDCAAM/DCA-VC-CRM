
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MemoizedDealCard } from '@/components/deals/MemoizedDealCard';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { Deal } from '@/types/deal';

interface DealListViewProps {
  deals: Deal[];
  onViewDetails: (deal: Deal) => void;
  selectedDeals?: string[];
  onToggleDealSelection?: (dealId: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  isAllSelected?: boolean;
  onDealAdded?: () => void;
}

export function DealListView({ 
  deals, 
  onViewDetails, 
  selectedDeals = [],
  onToggleDealSelection,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onDealAdded
}: DealListViewProps) {
  const showSelection = !!onToggleDealSelection;

  if (deals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Deals Found</CardTitle>
          <CardDescription>
            No deals match your current filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria.
            </p>
            {onDealAdded && (
              <AddDealDialog onDealAdded={onDealAdded}>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first deal
                </Button>
              </AddDealDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {deals.map((deal) => (
        <MemoizedDealCard 
          key={deal.id} 
          deal={deal}
          onViewDetails={onViewDetails}
          isSelected={selectedDeals.includes(deal.id)}
          onToggleSelection={onToggleDealSelection}
          showSelection={showSelection}
        />
      ))}
    </div>
  );
}
