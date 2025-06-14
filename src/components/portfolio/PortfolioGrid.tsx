
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PortfolioCard } from '@/components/portfolio/PortfolioCard';
import AddPortfolioDialog from '@/components/portfolio/AddPortfolioDialog';
import { PortfolioCompany } from '@/hooks/usePortfolioCompanies';

interface PortfolioGridProps {
  companies: PortfolioCompany[];
  filteredCompanies: PortfolioCompany[];
  onViewDetails: (company: PortfolioCompany) => void;
  onSuccess: () => void;
}

export function PortfolioGrid({
  companies,
  filteredCompanies,
  onViewDetails,
  onSuccess
}: PortfolioGridProps) {
  if (filteredCompanies.length === 0) {
    return (
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
              <AddPortfolioDialog onSuccess={onSuccess}>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first portfolio company
                </Button>
              </AddPortfolioDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCompanies.map((company) => (
        <PortfolioCard 
          key={company.id} 
          company={company}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
