
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function Portfolio() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Companies</h1>
          <p className="text-gray-600">Track your invested companies</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>All companies in your investment portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No portfolio companies found</p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add your first portfolio company
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
