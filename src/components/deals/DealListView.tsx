
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DealCard } from '@/components/deals/DealCard';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { Deal } from '@/types/deal';

interface DealListViewProps {
  deals: Deal[];
  filteredDeals: Deal[];
  onViewDetails: (deal: Deal) => void;
  onDealAdded: () => void;
}

export function DealListView({ deals, filteredDeals, onViewDetails, onDealAdded }: DealListViewProps) {
  if (filteredDeals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Deals Found</CardTitle>
          <CardDescription>
            {deals.length === 0 
              ? "You haven't added any deals yet."
              : "No deals match your current filters."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {deals.length === 0 
                ? "Start by adding your first deal to track in your pipeline."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {deals.length === 0 && (
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
      {filteredDeals.map((deal) => (
        <DealCard 
          key={deal.id} 
          deal={deal}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
