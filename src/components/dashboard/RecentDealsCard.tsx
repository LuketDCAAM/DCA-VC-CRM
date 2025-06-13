
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Deal {
  id: string;
  company_name: string;
  pipeline_stage: string;
  round_stage: string | null;
  updated_at: string;
}

interface RecentDealsCardProps {
  deals: Deal[];
}

export function RecentDealsCard({ deals }: RecentDealsCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Deals</CardTitle>
          <CardDescription>Latest updates in your pipeline</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/deals')} className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {deals.length > 0 ? (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{deal.company_name}</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {deal.pipeline_stage}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {deal.round_stage && `${deal.round_stage} • `}
                  Updated {new Date(deal.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No deals yet. Start by adding your first deal!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
