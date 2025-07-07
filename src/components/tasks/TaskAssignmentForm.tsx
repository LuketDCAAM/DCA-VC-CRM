
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useTaskAssignment } from '@/hooks/useTaskAssignment';
import { AssigneeSelector } from './AssigneeSelector';
import { TaskOptionsSelector } from './TaskOptionsSelector';

interface TaskAssignmentFormProps {
  dealId?: string;
  portfolioCompanyId?: string;
  investorId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaskAssignmentForm({
  dealId,
  portfolioCompanyId,
  investorId,
  onSuccess,
  onCancel,
}: TaskAssignmentFormProps) {
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignees([]);
    setPriority('medium');
    setDueDate(undefined);
    setSendEmailReminder(false);
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
      resetForm();
      onSuccess();
    }
  };

  return (
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

      <AssigneeSelector
        users={users}
        assignees={assignees}
        loading={loading}
        onAssigneeToggle={handleAssigneeToggle}
        onRemoveAssignee={removeAssignee}
      />

      <TaskOptionsSelector
        priority={priority}
        dueDate={dueDate}
        onPriorityChange={setPriority}
        onDueDateChange={setDueDate}
      />

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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title || assignees.length === 0 || !dueDate}>
          Assign Task
        </Button>
      </div>
    </form>
  );
}
