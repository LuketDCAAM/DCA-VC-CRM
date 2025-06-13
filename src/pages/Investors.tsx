
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function Investors() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-gray-600">Manage your investor relationships</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Investor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investor Directory</CardTitle>
          <CardDescription>All your investor contacts and relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No investors found</p>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add your first investor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
