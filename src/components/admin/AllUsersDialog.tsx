
import React, { useState } from 'react';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, Shield, Eye, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AllUsersDialog() {
  const { users, loading, updateUserRole, updateApprovalStatus } = useAllUsers();
  const { isAdmin } = useUserRoles();
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  if (!isAdmin) return null;

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

  const handleRoleChange = async (userId: string, currentRoles: string[], newRole: string) => {
    // Remove all current roles first
    for (const role of currentRoles) {
      await updateUserRole(userId, role as 'admin' | 'user' | 'viewer', 'remove');
    }
    // Add the new role
    if (newRole) {
      await updateUserRole(userId, newRole as 'admin' | 'user' | 'viewer', 'add');
    }
  };

  const handleRejectUser = async (userId: string) => {
    await updateApprovalStatus(userId, 'rejected', rejectionReason);
    setRejectingUserId(null);
    setRejectionReason('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Manage All Users
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Manage user roles and approval status for all users in the system.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.user_id}>
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

                  <div className="flex items-center gap-2 flex-wrap">
                    {user.approval_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateApprovalStatus(user.user_id, 'approved')}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectingUserId(user.user_id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {user.approval_status === 'approved' && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`role-${user.user_id}`} className="text-sm">
                          Change Role:
                        </Label>
                        <Select
                          onValueChange={(value) => handleRoleChange(user.user_id, user.roles, value)}
                          defaultValue={user.roles[0] || ''}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {rejectingUserId === user.user_id && (
                    <div className="space-y-2 p-3 border rounded-lg bg-red-50">
                      <Label htmlFor="rejection-reason">Rejection Reason (optional)</Label>
                      <Textarea
                        id="rejection-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectUser(user.user_id)}
                        >
                          Confirm Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectingUserId(null);
                            setRejectionReason('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found in the system.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
