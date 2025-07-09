
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserRoleSelectorProps {
  userId: string;
  currentRoles: string[];
  onRoleChange: (userId: string, currentRoles: string[], newRole: string) => Promise<void>;
}

export function UserRoleSelector({ userId, currentRoles, onRoleChange }: UserRoleSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={`role-${userId}`} className="text-sm">
        Change Role:
      </Label>
      <Select
        onValueChange={(value) => onRoleChange(userId, currentRoles, value)}
        defaultValue={currentRoles[0] || ''}
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
  );
}
