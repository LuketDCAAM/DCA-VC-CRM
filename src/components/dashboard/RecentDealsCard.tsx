
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, TrendingUp } from 'lucide-react';
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

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'invested':
        return 'bg-green-100 text-green-800';
      case 'passed':
        return 'bg-red-100 text-red-800';
      case 'due diligence':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Recent Deals</CardTitle>
          <CardDescription>Latest updates in your pipeline</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/deals')}>
          <Eye className="h-4 w-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {deals.length > 0 ? (
          <>
            {deals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium text-sm">{deal.company_name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${getStageColor(deal.pipeline_stage)}`}>
                      {deal.pipeline_stage}
                    </Badge>
                    {deal.round_stage && (
                      <span className="text-xs text-muted-foreground">
                        {deal.round_stage}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(deal.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-2">No deals yet</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Start by adding your first deal to track your pipeline
            </p>
            <Button size="sm" onClick={() => navigate('/deals')}>
              Add Deal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
