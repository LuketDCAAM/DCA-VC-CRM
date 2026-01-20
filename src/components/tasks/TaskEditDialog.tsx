
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, UserCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  reminder_date: string;
  priority: string | null;
  status: string | null;
  assignees?: UserProfile[];
  creator?: UserProfile;
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  users: UserProfile[];
  onSave: (taskId: string, data: {
    title: string;
    description: string | null;
    reminder_date: string;
    priority: string;
    status: string;
    assignees: string[];
  }) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
}

export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  users,
  onSave,
  onDelete,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setReminderDate(task.reminder_date?.split('T')[0] || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setAssignees(task.assignees?.map(a => a.id) || []);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    
    setSaving(true);
    const success = await onSave(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      reminder_date: reminderDate,
      priority,
      status,
      assignees,
    });
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    setDeleting(true);
    const success = await onDelete(task.id);
    setDeleting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const toggleAssignee = (userId: string) => {
    setAssignees(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeAssignee = (userId: string) => {
    setAssignees(prev => prev.filter(id => id !== userId));
  };

  const selectedUsers = users.filter(u => assignees.includes(u.id));
  const availableUsers = users.filter(u => !assignees.includes(u.id));

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Creator info */}
          {task.creator && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Created by <span className="font-medium text-foreground">{task.creator.name || task.creator.email}</span>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignees</Label>
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(user => (
                  <Badge key={user.id} variant="secondary" className="gap-1">
                    {user.name || user.email}
                    <button
                      type="button"
                      onClick={() => removeAssignee(user.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Select onValueChange={toggleAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="Add assignee..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    All users assigned
                  </div>
                ) : (
                  availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
