
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Portfolio Updates</CardTitle>
          <CardDescription>Latest portfolio company activity</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/portfolio')}>
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {companies.length > 0 ? (
          <div className="space-y-4">
            {companies.map((company) => (
              <div 
                key={company.id} 
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onViewDetails(company)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{company.company_name}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    company.status === 'Active' ? 'bg-green-100 text-green-800' :
                    company.status === 'Exited' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {company.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {company.investments.length} investment{company.investments.length !== 1 ? 's' : ''} • 
                  Updated {new Date(company.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No portfolio companies yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
