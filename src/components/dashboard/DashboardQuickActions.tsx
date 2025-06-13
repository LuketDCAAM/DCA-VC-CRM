
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardQuickActions() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={() => navigate('/deals')} className="flex items-center justify-center gap-2 h-12">
            <DollarSign className="h-4 w-4" />
            Add New Deal
          </Button>
          <Button onClick={() => navigate('/portfolio')} variant="outline" className="flex items-center justify-center gap-2 h-12">
            <Building2 className="h-4 w-4" />
            Add Portfolio Company
          </Button>
          <Button onClick={() => navigate('/investors')} variant="outline" className="flex items-center justify-center gap-2 h-12">
            <Users className="h-4 w-4" />
            Add Investor
          </Button>
          <Button onClick={() => navigate('/contacts')} variant="outline" className="flex items-center justify-center gap-2 h-12">
            <Users className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
