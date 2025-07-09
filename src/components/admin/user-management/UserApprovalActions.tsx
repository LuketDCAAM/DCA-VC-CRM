
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX } from 'lucide-react';

interface UserApprovalActionsProps {
  userId: string;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string) => void;
}

export function UserApprovalActions({ userId, onApprove, onReject }: UserApprovalActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        size="sm"
        onClick={() => onApprove(userId)}
      >
        <UserCheck className="h-4 w-4 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onReject(userId)}
      >
        <UserX className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}
