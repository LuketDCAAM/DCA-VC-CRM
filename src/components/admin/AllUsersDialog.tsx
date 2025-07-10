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
import { Users } from 'lucide-react';
import { UserCard } from './user-management/UserCard';
import { UserRoleSelector } from './user-management/UserRoleSelector';
import { UserApprovalActions } from './user-management/UserApprovalActions';
import { UserRejectionForm } from './user-management/UserRejectionForm';

export function AllUsersDialog() {
  // Correctly destructure updateUserApprovalStatus from the hook
  const { users, loading, updateUserRole, updateUserApprovalStatus } = useAllUsers();
  const { isAdmin } = useUserRoles();
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  if (!isAdmin) return null;

  // Modified handleRoleChange to use the updated updateUserRole signature
  const handleRoleChange = async (userId: string, currentRoles: string[], newRole: string) => {
    // The updateUserRole function in useAllUsers now directly sets the role.
    // So, we just call it with the new role. The previous logic of 'add'/'remove' is internal to the hook.
    // Ensure newRole is cast to the correct type expected by updateUserRole
    await updateUserRole(userId, newRole as Parameters<typeof updateUserRole>[1]);
  };

  const handleRejectUser = async (userId: string) => {
    // Use updateUserApprovalStatus
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
              <UserCard key={user.user_id} user={user}>
                <div className="flex items-center gap-2 flex-wrap">
                  {user.approval_status === 'pending' && (
                    <UserApprovalActions
                      userId={user.user_id}
                      // Use updateUserApprovalStatus
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
      </DialogContent>
    </Dialog>
  );
}
