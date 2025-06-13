
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { DealCard } from '@/components/deals/DealCard';
import { useDeals } from '@/hooks/useDeals';
import { Skeleton } from '@/components/ui/skeleton';

export default function Deals() {
  const { deals, loading, refetch } = useDeals();

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Deals</h1>
            <p className="text-gray-600">Manage your investment pipeline</p>
          </div>
          <AddDealDialog onDealAdded={refetch} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-gray-600">Manage your investment pipeline</p>
        </div>
        <AddDealDialog onDealAdded={refetch} />
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Deal Pipeline</CardTitle>
            <CardDescription>Track all potential investment opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No deals found</p>
              <AddDealDialog onDealAdded={refetch} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{deals.length}</div>
                <p className="text-sm text-gray-600">Total Deals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {deals.filter(d => d.pipeline_stage === 'Invested').length}
                </div>
                <p className="text-sm text-gray-600">Invested</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {deals.filter(d => d.pipeline_stage === 'Due Diligence').length}
                </div>
                <p className="text-sm text-gray-600">Due Diligence</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {deals.filter(d => d.pipeline_stage === 'Term Sheet').length}
                </div>
                <p className="text-sm text-gray-600">Term Sheet</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
