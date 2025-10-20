
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, DollarSign, Users, UserPlus, HandCoins } from 'lucide-react';
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
      title: "Add LP Engagement",
      icon: HandCoins,
      onClick: () => navigate('/lp-engagements'),
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
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Common tasks to get started</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              onClick={action.onClick}
              variant={action.variant}
              className="h-16 sm:h-14 flex flex-col items-center justify-center gap-1 sm:gap-2 p-2 sm:p-4"
            >
              <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-sm font-medium text-center leading-tight">
                {action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
