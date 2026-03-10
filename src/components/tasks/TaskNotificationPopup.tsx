
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';

export function TaskNotificationPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const sessionKey = `task-popup-shown-${user.id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const fetchUserTasks = async () => {
      // Get tasks where user is directly assigned
      const { count: directCount } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('task_type', 'task')
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress']);

      // Get tasks via task_assignments
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('assigned_to', user.id);

      let assignmentCount = 0;
      if (assignments && assignments.length > 0) {
        const taskIds = assignments.map(a => a.task_id);
        const { count } = await supabase
          .from('reminders')
          .select('*', { count: 'exact', head: true })
          .eq('task_type', 'task')
          .in('id', taskIds)
          .in('status', ['pending', 'in_progress']);
        assignmentCount = count || 0;
      }

      // Use the higher count (they may overlap)
      const total = Math.max(directCount || 0, assignmentCount);
      
      if (total > 0) {
        setTaskCount(total);
        setOpen(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    };

    fetchUserTasks();
  }, [user]);

  const handleViewTasks = () => {
    setOpen(false);
    navigate('/tasks');
  };

  if (!taskCount) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Outstanding Tasks
          </DialogTitle>
          <DialogDescription>
            You have <span className="font-semibold text-foreground">{taskCount}</span> outstanding{' '}
            {taskCount === 1 ? 'task' : 'tasks'} that {taskCount === 1 ? 'needs' : 'need'} your attention.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
          <Button onClick={handleViewTasks}>
            View Tasks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
