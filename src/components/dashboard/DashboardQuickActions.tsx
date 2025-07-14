
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, Users, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardQuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Add New Deal",
      icon: DollarSign,
      onClick: () => navigate('/deals'),
      variant: "default" as const,
    },
    {
      title: "Add Portfolio Company",
      icon: Building2,
      onClick: () => navigate('/portfolio'),
      variant: "outline" as const,
    },
    {
      title: "Add Venture Investor",
      icon: Users,
      onClick: () => navigate('/investors'),
      variant: "outline" as const,
    },
    {
      title: "Add Contact",
      icon: UserPlus,
      onClick: () => navigate('/contacts'),
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              onClick={action.onClick}
              variant={action.variant}
              className="h-14 flex flex-col items-center justify-center gap-2 p-4"
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium text-center leading-tight">
                {action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
