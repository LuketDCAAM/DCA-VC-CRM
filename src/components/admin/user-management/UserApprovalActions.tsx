
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

interface UserApprovalActionsProps {
  userId: string;
  userEmail: string;
  userName: string;
  onApprove: (userId: string, role: Tables<'user_roles'>['role']) => Promise<void>;
  onReject: (userId: string) => void;
  isLoading?: boolean;
}

export function UserApprovalActions({ userId, userEmail, userName, onApprove, onReject, isLoading }: UserApprovalActionsProps) {
  const [selectedRole, setSelectedRole] = useState<Tables<'user_roles'>['role']>('user');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(userId, selectedRole);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      onReject(userId);
    } finally {
      setIsRejecting(false);
    }
  };

  const isDisabled = isLoading || isApproving || isRejecting;

  const handleRoleChange = (value: string) => {
    setSelectedRole(value as Tables<'user_roles'>['role']);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor={`role-${userId}`} className="text-sm font-medium">
          Assign Role:
        </Label>
        <Select value={selectedRole} onValueChange={handleRoleChange} disabled={isDisabled}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isDisabled}
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4 mr-1" />
          )}
          {isApproving ? 'Approving...' : 'Approve & Email'}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReject}
          disabled={isDisabled}
        >
          {isRejecting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <UserX className="h-4 w-4 mr-1" />
          )}
          {isRejecting ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
}
