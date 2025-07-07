import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTaskAssignment } from '@/hooks/useTaskAssignment';
import { Badge } from '@/components/ui/badge';

interface TaskAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
  portfolioCompanyId?: string;
  investorId?: string;
  onTaskCreated?: () => void;
}

export function TaskAssignmentDialog({
  open,
  onOpenChange,
  dealId,
  portfolioCompanyId,
  investorId,
  onTaskCreated,
}: TaskAssignmentDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState<Date>();
  const [sendEmailReminder, setSendEmailReminder] = useState(false);
  
  const { users, loading, assignTask } = useTaskAssignment();

  const handleAssigneeToggle = (userId: string) => {
    setAssignees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeAssignee = (userId: string) => {
    setAssignees(prev => prev.filter(id => id !== userId));
  };

  const getSelectedUsers = () => {
    return users.filter(user => assignees.includes(user.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignees.length === 0 || !dueDate) return;

    const success = await assignTask({
      title,
      description: description || undefined,
      reminder_date: format(dueDate, 'yyyy-MM-dd'),
      assignees,
      deal_id: dealId,
      portfolio_company_id: portfolioCompanyId,
      investor_id: investorId,
      task_type: 'task',
      priority,
      status: 'pending',
      send_email_reminder: sendEmailReminder,
    });

    if (success) {
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setAssignees([]);
      setPriority('medium');
      setDueDate(undefined);
      setSendEmailReminder(false);
      onTaskCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            {assignees.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {getSelectedUsers().map((user) => (
                  <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                    {user.name || user.email}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeAssignee(user.id)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <Select onValueChange={handleAssigneeToggle}>
              <SelectTrigger>
                <SelectValue placeholder="Select users to assign..." />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="" disabled>Loading users...</SelectItem>
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

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-reminder"
              checked={sendEmailReminder}
              onCheckedChange={(checked) => setSendEmailReminder(checked === true)}
            />
            <Label htmlFor="email-reminder" className="text-sm">
              Send email reminder to assignees
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || assignees.length === 0 || !dueDate}>
              Assign Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
