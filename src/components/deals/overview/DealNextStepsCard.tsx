
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar } from 'lucide-react';
import { Deal } from '@/types/deal';

interface DealNextStepsCardProps {
  deal: Deal;
}

export function DealNextStepsCard({ deal }: DealNextStepsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-blue-600" />
          Next Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deal.next_steps ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.next_steps}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Last updated: {new Date(deal.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No next steps defined yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
