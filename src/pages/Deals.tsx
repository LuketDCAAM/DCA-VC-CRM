
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { DealCard } from '@/components/deals/DealCard';
import { DealDetailDialog } from '@/components/deals/DealDetailDialog';
import { AddDealDialog } from '@/components/deals/AddDealDialog';
import { DealPipelineBoard } from '@/components/deals/DealPipelineBoard';

export default function Deals() {
  const { deals, loading, refetch } = useDeals();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewMode, setViewMode] = useState('board');

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || deal.pipeline_stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal);
    setShowDetailDialog(true);
  };

  const activeDeals = deals.filter(deal => !['Invested', 'Passed'].includes(deal.pipeline_stage)).length;
  const investedDeals = deals.filter(deal => deal.pipeline_stage === 'Invested').length;
  const passedDeals = deals.filter(deal => deal.pipeline_stage === 'Passed').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Deal Flow</h1>
          <p className="text-gray-600">Manage your investment pipeline</p>
        </div>
        <AddDealDialog onDealAdded={refetch}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </AddDealDialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{investedDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{passedDeals}</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="board" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Pipeline Board
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:w-64 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                  <SelectItem value="First Meeting">First Meeting</SelectItem>
                  <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                  <SelectItem value="Term Sheet">Term Sheet</SelectItem>
                  <SelectItem value="Legal Review">Legal Review</SelectItem>
                  <SelectItem value="Invested">Invested</SelectItem>
                  <SelectItem value="Passed">Passed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="board" className="mt-6">
            <DealPipelineBoard deals={filteredDeals} onViewDetails={handleViewDetails} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            {filteredDeals.length === 0 ? (
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
                      <AddDealDialog onDealAdded={refetch}>
                        <Button variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add your first deal
                        </Button>
                      </AddDealDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeals.map((deal) => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Deal Detail Dialog */}
      {selectedDeal && (
        <DealDetailDialog
          deal={selectedDeal}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          onDealUpdated={() => {
            refetch();
            setShowDetailDialog(false);
          }}
        />
      )}
    </div>
  );
}
