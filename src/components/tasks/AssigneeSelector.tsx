
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface AssigneeSelectorProps {
  users: UserProfile[];
  assignees: string[];
  loading: boolean;
  onAssigneeToggle: (userId: string) => void;
  onRemoveAssignee: (userId: string) => void;
}

export function AssigneeSelector({
  users,
  assignees,
  loading,
  onAssigneeToggle,
  onRemoveAssignee,
}: AssigneeSelectorProps) {
  const getSelectedUsers = () => {
    return users.filter(user => assignees.includes(user.id));
  };

  return (
    <div className="space-y-2">
      <Label>Assign To</Label>
      {assignees.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {getSelectedUsers().map((user) => (
            <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
              {user.name || user.email}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onRemoveAssignee(user.id)}
              />
            </Badge>
          ))}
        </div>
      )}
      <Select onValueChange={onAssigneeToggle}>
        <SelectTrigger>
          <SelectValue placeholder="Select users to assign..." />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>Loading users...</SelectItem>
          ) : users.length === 0 ? (
            <SelectItem value="no-users" disabled>No users available</SelectItem>
          ) : (
            users.map((user) => (
              <SelectItem 
                key={user.id} 
                value={user.id}
                disabled={assignees.includes(user.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{user.name || user.email}</span>
                  {assignees.includes(user.id) && (
                    <span className="text-xs text-green-600 ml-2">✓ Selected</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {assignees.length === 0 && (
        <p className="text-sm text-red-500">Please select at least one assignee</p>
      )}
    </div>
  );
}
