
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
  creator?: UserProfile;
}

interface TasksByUser {
  user: UserProfile;
  tasks: Task[];
}

interface TaskUpdateData {
  title: string;
  description?: string | null;
  reminder_date: string;
  priority: string;
  status: string;
  assignees?: string[];
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch task assignments for current user
      const { data: myAssignments } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('assigned_to', user.id);

      const assignedTaskIds = myAssignments?.map(a => a.task_id) || [];

      // Fetch all tasks where user is creator, directly assigned, or via task_assignments
      const { data: tasksData, error: tasksError } = await supabase
        .from('reminders')
        .select('*')
        .eq('task_type', 'task')
        .order('reminder_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Filter to only tasks relevant to the current user
      const userTasks = (tasksData || []).filter(task =>
        task.created_by === user.id ||
        task.assigned_to === user.id ||
        assignedTaskIds.includes(task.id)
      );

      // Fetch all task assignments for user's tasks
      const userTaskIds = userTasks.map(t => t.id);
      let assignmentsData: any[] = [];
      if (userTaskIds.length > 0) {
        const { data, error: assignmentsError } = await supabase
          .from('task_assignments')
          .select('*')
          .in('task_id', userTaskIds);
        if (assignmentsError) throw assignmentsError;
        assignmentsData = data || [];
      }

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase.rpc('get_user_profiles');
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Map assignments and creators to tasks
      const tasksWithDetails = userTasks.map(task => {
        const taskAssignments = assignmentsData.filter(a => a.task_id === task.id);
        const assigneeIds = taskAssignments.map(a => a.assigned_to);
        
        if (task.assigned_to && !assigneeIds.includes(task.assigned_to)) {
          assigneeIds.push(task.assigned_to);
        }
        
        const assignees = usersData?.filter((u: UserProfile) => assigneeIds.includes(u.id)) || [];
        const creator = usersData?.find((u: UserProfile) => u.id === task.created_by);
        
        return { ...task, assignees, creator };
      });

      setTasks(tasksWithDetails);
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

  const updateTask = async (taskId: string, data: TaskUpdateData) => {
    try {
      // Update the task in reminders table
      const { error: taskError } = await supabase
        .from('reminders')
        .update({
          title: data.title,
          description: data.description || null,
          reminder_date: data.reminder_date,
          priority: data.priority,
          status: data.status,
          assigned_to: data.assignees?.[0] || null,
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Update task assignments if provided
      if (data.assignees !== undefined) {
        // Delete existing assignments
        const { error: deleteError } = await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', taskId);

        if (deleteError) throw deleteError;

        // Insert new assignments
        if (data.assignees.length > 0) {
          const assignments = data.assignees.map(assigneeId => ({
            task_id: taskId,
            assigned_to: assigneeId,
          }));

          const { error: insertError } = await supabase
            .from('task_assignments')
            .insert(assignments);

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Task updated",
        description: "Task has been updated successfully.",
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

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });

      fetchTasks();
      return true;
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error deleting task",
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
    updateTask,
    deleteTask,
    getTasksByUser,
    refetch: fetchTasks,
  };
}
