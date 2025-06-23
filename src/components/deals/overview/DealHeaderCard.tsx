
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Tag } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealHeaderCardProps {
  deal: Deal;
}

const getStageColor = (stage: string) => {
  const colors = {
    'Inactive': 'bg-gray-100 text-gray-800',
    'Initial Contact': 'bg-gray-100 text-gray-800',
    'First Meeting': 'bg-blue-100 text-blue-800',
    'Due Diligence': 'bg-yellow-100 text-yellow-800',
    'Memo': 'bg-purple-100 text-purple-800',
    'Legal Review': 'bg-orange-100 text-orange-800',
    'Invested': 'bg-green-100 text-green-800',
    'Passed': 'bg-red-100 text-red-800',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export function DealHeaderCard({ deal }: DealHeaderCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {deal.company_name}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getStageColor(deal.pipeline_stage)}>
                {deal.pipeline_stage}
              </Badge>
              {deal.round_stage && (
                <Badge variant="outline">
                  {deal.round_stage}
                </Badge>
              )}
              {deal.sector && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {deal.sector}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created: {new Date(deal.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="h-4 w-4" />
              Updated: {new Date(deal.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
