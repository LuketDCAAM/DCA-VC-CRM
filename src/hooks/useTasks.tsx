
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  is_completed: boolean;
  deal_id: string | null;
  portfolio_company_id: string | null;
  investor_id: string | null;
  created_by: string;
  created_at: string;
  assigned_to: string | null;
  task_type: string | null;
  priority: string | null;
  status: string | null;
  assignees?: UserProfile[];
}

interface TasksByUser {
  user: UserProfile;
  tasks: Task[];
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch all tasks (task_type = 'task')
      const { data: tasksData, error: tasksError } = await supabase
        .from('reminders')
        .select('*')
        .eq('task_type', 'task')
        .order('reminder_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch all task assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('*');

      if (assignmentsError) throw assignmentsError;

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase.rpc('get_user_profiles');
      
      if (usersError) throw usersError;
      
      setUsers(usersData || []);

      // Map assignments to tasks
      const tasksWithAssignees = (tasksData || []).map(task => {
        const taskAssignments = assignmentsData?.filter(a => a.task_id === task.id) || [];
        const assigneeIds = taskAssignments.map(a => a.assigned_to);
        
        // Also include the assigned_to field for backward compatibility
        if (task.assigned_to && !assigneeIds.includes(task.assigned_to)) {
          assigneeIds.push(task.assigned_to);
        }
        
        const assignees = usersData?.filter((u: UserProfile) => assigneeIds.includes(u.id)) || [];
        
        return {
          ...task,
          assignees,
        };
      });

      setTasks(tasksWithAssignees);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error fetching tasks",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });

      fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const getTasksByUser = (): TasksByUser[] => {
    const tasksByUserMap = new Map<string, TasksByUser>();
    
    // Initialize with all users
    users.forEach(user => {
      tasksByUserMap.set(user.id, { user, tasks: [] });
    });

    // Add unassigned group
    const unassignedUser: UserProfile = { id: 'unassigned', email: '', name: 'Unassigned' };
    tasksByUserMap.set('unassigned', { user: unassignedUser, tasks: [] });

    // Group tasks by user
    tasks.forEach(task => {
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach(assignee => {
          const existing = tasksByUserMap.get(assignee.id);
          if (existing) {
            existing.tasks.push(task);
          }
        });
      } else {
        const unassigned = tasksByUserMap.get('unassigned');
        if (unassigned) {
          unassigned.tasks.push(task);
        }
      }
    });

    // Filter out users with no tasks and sort by task count
    return Array.from(tasksByUserMap.values())
      .filter(group => group.tasks.length > 0)
      .sort((a, b) => b.tasks.length - a.tasks.length);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    users,
    loading,
    updateTaskStatus,
    getTasksByUser,
    refetch: fetchTasks,
  };
}
