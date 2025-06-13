
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PortfolioCompany {
  id: string;
  company_name: string;
  status: string;
  investments: any[];
  updated_at: string;
}

interface RecentPortfolioCardProps {
  companies: PortfolioCompany[];
  onViewDetails: (company: PortfolioCompany) => void;
}

export function RecentPortfolioCard({ companies, onViewDetails }: RecentPortfolioCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'exited':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Recent Portfolio Updates</CardTitle>
          <CardDescription>Latest portfolio company activity</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/portfolio')}>
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {companies.length > 0 ? (
          <>
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onViewDetails(company)}
              >
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium text-sm">{company.company_name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${getStatusColor(company.status)}`}>
                      {company.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {company.investments.length} investment{company.investments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(company.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-2">No portfolio companies yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Add your first portfolio company to start tracking investments
            </p>
            <Button size="sm" onClick={() => navigate('/portfolio')}>
              Add Company
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
