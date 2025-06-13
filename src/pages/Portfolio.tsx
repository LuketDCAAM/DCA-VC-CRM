
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import AddPortfolioDialog from '@/components/portfolio/AddPortfolioDialog';
import { useState } from 'react';

export default function Portfolio() {
  const { companies, loading, refetch } = usePortfolioCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvested = companies.reduce((sum, company) => 
    sum + company.investments.reduce((invSum, inv) => invSum + inv.amount_invested, 0), 0
  );

  const activeCompanies = companies.filter(c => c.status === 'Active').length;
  const exitedCompanies = companies.filter(c => c.status === 'Exited').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading portfolio companies...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Companies</h1>
          <p className="text-gray-600">Track your invested companies</p>
        </div>
        <AddPortfolioDialog onSuccess={refetch}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </AddPortfolioDialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(totalInvested / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Exited">Exited</SelectItem>
            <SelectItem value="Dissolved">Dissolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Portfolio Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Portfolio Companies</CardTitle>
            <CardDescription>
              {companies.length === 0 
                ? "You haven't added any portfolio companies yet."
                : "No companies match your current filters."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                {companies.length === 0 
                  ? "Start by adding your first portfolio company or mark a deal as 'Invested' to automatically create one."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {companies.length === 0 && (
                <AddPortfolioDialog onSuccess={refetch}>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first portfolio company
                  </Button>
                </AddPortfolioDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <PortfolioCard 
              key={company.id} 
              company={company}
              onViewDetails={(company) => {
                // TODO: Implement detailed view
                console.log('View details for:', company.company_name);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
