
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface NoInvestorsFoundProps {
  hasInvestors: boolean;
  onAddNew: () => void;
}

export function NoInvestorsFound({ hasInvestors, onAddNew }: NoInvestorsFoundProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Investors Found</CardTitle>
        <CardDescription>
          {hasInvestors
            ? "No investors match your current filters."
            : "You haven't added any investors yet."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {hasInvestors
              ? "Try adjusting your search or filter criteria."
              : "Start by adding your first investor to track relationships."
            }
          </p>
          {!hasInvestors && (
            <Button variant="outline" onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first investor
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
