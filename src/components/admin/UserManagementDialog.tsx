
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck } from 'lucide-react';
import { UserCard } from './user-management/UserCard';
import { UserRoleSelector } from './user-management/UserRoleSelector';
import { UserApprovalActions } from './user-management/UserApprovalActions';
import { UserRejectionForm } from './user-management/UserRejectionForm';

export function UserManagementDialog() {
  const { users, loading, updateUserRole, updateUserApprovalStatus } = useAllUsers();
  const { isAdmin } = useUserRoles();
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  if (!isAdmin) return null;

  const pendingUsers = users.filter(user => user.approval_status === 'pending');
  const approvedUsers = users.filter(user => user.approval_status === 'approved');

  const handleRoleChange = async (userId: string, currentRoles: string[], newRole: string) => {
    await updateUserRole(userId, newRole as Parameters<typeof updateUserRole>[1]);
  };

  const handleRejectUser = async (userId: string) => {
    await updateUserApprovalStatus(userId, 'rejected', rejectionReason);
    setRejectingUserId(null);
    setRejectionReason('');
  };

  const handleCancelRejection = () => {
    setRejectingUserId(null);
    setRejectionReason('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          User Management
          {pendingUsers.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingUsers.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Manage user approvals and roles for all users in the system.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Pending Approvals
              {pendingUsers.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading pending users...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending user approvals
              </div>
            ) : (
              pendingUsers.map((user) => (
                <UserCard key={user.user_id} user={user}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <UserApprovalActions
                      userId={user.user_id}
                      onApprove={(userId) => updateUserApprovalStatus(userId, 'approved')}
                      onReject={setRejectingUserId}
                    />
                  </div>

                  {rejectingUserId === user.user_id && (
                    <UserRejectionForm
                      userId={user.user_id}
                      rejectionReason={rejectionReason}
                      onReasonChange={setRejectionReason}
                      onConfirmReject={handleRejectUser}
                      onCancel={handleCancelRejection}
                    />
                  )}
                </UserCard>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading users...</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <UserCard key={user.user_id} user={user}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {user.approval_status === 'pending' && (
                        <UserApprovalActions
                          userId={user.user_id}
                          onApprove={(userId) => updateUserApprovalStatus(userId, 'approved')}
                          onReject={setRejectingUserId}
                        />
                      )}

                      {user.approval_status === 'approved' && (
                        <UserRoleSelector
                          userId={user.user_id}
                          currentRoles={user.roles}
                          onRoleChange={handleRoleChange}
                        />
                      )}
                    </div>

                    {rejectingUserId === user.user_id && (
                      <UserRejectionForm
                        userId={user.user_id}
                        rejectionReason={rejectionReason}
                        onReasonChange={setRejectionReason}
                        onConfirmReject={handleRejectUser}
                        onCancel={handleCancelRejection}
                      />
                    )}
                  </UserCard>
                ))}

                {users.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found in the system.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
