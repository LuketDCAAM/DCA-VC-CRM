
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, User } from 'lucide-react';

interface UserCardProps {
  user: {
    user_id: string;
    email: string;
    name: string;
    roles: string[];
    approval_status: string;
    created_at: string;
  };
  children: React.ReactNode;
}

export function UserCard({ user, children }: UserCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
      case 'user':
        return <User className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {user.name || 'No name provided'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              Joined: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge className={`${getStatusColor(user.approval_status)}`}>
            {user.approval_status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Roles:</span>
          {user.roles.length > 0 ? (
            user.roles.map((role) => (
              <Badge key={role} variant="outline" className="flex items-center gap-1">
                {getRoleIcon(role)}
                {role}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No roles assigned</span>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
