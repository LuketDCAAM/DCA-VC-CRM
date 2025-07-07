
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTaskAssignment } from '@/hooks/useTaskAssignment';

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
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [dueDate, setDueDate] = useState<Date>();
  
  const { users, loading, assignTask } = useTaskAssignment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedTo || !dueDate) return;

    const success = await assignTask({
      title,
      description: description || undefined,
      reminder_date: format(dueDate, 'yyyy-MM-dd'),
      assigned_to: assignedTo,
      deal_id: dealId,
      portfolio_company_id: portfolioCompanyId,
      investor_id: investorId,
      task_type: 'task',
      priority,
      status: 'pending',
    });

    if (success) {
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setPriority('medium');
      setDueDate(undefined);
      onTaskCreated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
            <Select value={assignedTo} onValueChange={setAssignedTo} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="" disabled>Loading users...</SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !assignedTo || !dueDate}>
              Assign Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
