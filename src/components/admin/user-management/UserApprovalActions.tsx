
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserCheck, UserX } from 'lucide-react';

interface UserApprovalActionsProps {
  userId: string;
  userEmail: string;
  userName: string;
  onApprove: (userId: string, role: string) => Promise<void>;
  onReject: (userId: string) => void;
}

export function UserApprovalActions({ userId, userEmail, userName, onApprove, onReject }: UserApprovalActionsProps) {
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(userId, selectedRole);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor={`role-${userId}`} className="text-sm font-medium">
          Assign Role:
        </Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
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
          disabled={isApproving}
        >
          <UserCheck className="h-4 w-4 mr-1" />
          {isApproving ? 'Approving...' : 'Approve & Email'}
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
    </div>
  );
}
