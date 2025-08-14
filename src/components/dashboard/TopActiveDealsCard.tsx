import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings, Star } from 'lucide-react';
import { Deal } from '@/types/deal';
import { usePriorityDeals } from '@/hooks/usePriorityDeals';
import { useUserRoles } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { PriorityDealsManagementDialog } from './PriorityDealsManagementDialog';

interface TopActiveDealsCardProps {
  onViewDetails?: (deal: Deal) => void;
}

export function TopActiveDealsCard({ onViewDetails }: TopActiveDealsCardProps) {
  const { priorityDeals, isLoading } = usePriorityDeals();
  const { isViewer } = useUserRoles();
  const [showManagement, setShowManagement] = React.useState(false);

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'Initial Outreach': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'First Meeting': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Due Diligence': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Term Sheet': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Negotiation': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Invested': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Passed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Top Active Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading priority deals...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Top Active Deals
            </CardTitle>
            {!isViewer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManagement(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {priorityDeals.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No priority deals set</p>
              {!isViewer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManagement(true)}
                  className="mt-2"
                >
                  Set Priority Deals
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {priorityDeals.slice(0, 10).map((deal, index) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <h4 className="font-medium truncate">{deal.company_name}</h4>
                      {deal.deal_score && (
                        <Badge variant="secondary" className="text-xs">
                          Score: {deal.deal_score}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStageColor(deal.pipeline_stage)}`}
                      >
                        {deal.pipeline_stage}
                      </Badge>
                      {deal.round_stage && (
                        <Badge variant="outline" className="text-xs">
                          {deal.round_stage}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Updated {format(new Date(deal.updated_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails?.(deal)}
                    className="shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PriorityDealsManagementDialog
        open={showManagement}
        onClose={() => setShowManagement(false)}
      />
    </>
  );
}