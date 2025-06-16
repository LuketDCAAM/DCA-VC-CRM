
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Grid, List as ListIcon } from 'lucide-react';
import { DealCard } from '@/components/deals/DealCard';
import { VirtualizedDealList } from '@/components/deals/VirtualizedDealList';
import { DealsPagination } from '@/components/deals/DealsPagination';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { usePaginatedDeals, PaginationConfig, DealFilters } from '@/hooks/usePaginatedDeals';
import { Deal } from '@/types/deal';

interface EnhancedDealListViewProps {
  onViewDetails: (deal: Deal) => void;
  onDealAdded: () => void;
  filters: DealFilters;
}

export function EnhancedDealListView({ onViewDetails, onDealAdded, filters }: EnhancedDealListViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'virtual'>('grid'); 
  const [pagination, setPagination] = useState<PaginationConfig>({ page: 1, pageSize: 50 });
  
  const { deals, total, hasMore, loading, isRefetching } = usePaginatedDeals(pagination, filters);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ page: 1, pageSize });
  };

  const memoizedDeals = useMemo(() => deals, [deals]);

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (deals.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Deals Found</CardTitle>
          <CardDescription>
            No deals match your current filters or you haven't added any deals yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Start by adding your first deal to track in your pipeline.
            </p>
            <AddDealDialog onDealAdded={onDealAdded}>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add your first deal
              </Button>
            </AddDealDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            {total.toLocaleString()} total deals
          </span>
          {isRefetching && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'virtual')}>
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="virtual" className="flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              Virtual List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={viewMode} className="w-full">
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memoizedDeals.map((deal) => (
              <DealCard 
                key={deal.id} 
                deal={deal}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
          
          <DealsPagination
            currentPage={pagination.page}
            totalItems={total}
            itemsPerPage={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="virtual">
          <VirtualizedDealList 
            deals={memoizedDeals}
            onViewDetails={onViewDetails}
            height={600}
          />
          
          <DealsPagination
            currentPage={pagination.page}
            totalItems={total}
            itemsPerPage={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
