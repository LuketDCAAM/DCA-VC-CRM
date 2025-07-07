
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
}

interface TaskAssignment {
  id?: string;
  title: string;
  description?: string;
  reminder_date: string;
  assigned_to?: string; // For backward compatibility
  assignees?: string[]; // Multiple assignees
  deal_id?: string;
  portfolio_company_id?: string;
  investor_id?: string;
  task_type: 'reminder' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  send_email_reminder?: boolean;
}

export function useTaskAssignment() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_profiles');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskData: TaskAssignment) => {
    try {
      // First, create the task in the reminders table
      const { data: task, error: taskError } = await supabase
        .from('reminders')
        .insert({
          title: taskData.title,
          description: taskData.description,
          reminder_date: taskData.reminder_date,
          assigned_to: taskData.assignees?.[0] || taskData.assigned_to, // Keep first assignee for backward compatibility
          deal_id: taskData.deal_id,
          portfolio_company_id: taskData.portfolio_company_id,
          investor_id: taskData.investor_id,
          task_type: taskData.task_type,
          priority: taskData.priority,
          status: taskData.status,
          send_email_reminder: taskData.send_email_reminder || false,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // If we have multiple assignees, create task assignments
      if (taskData.assignees && taskData.assignees.length > 0) {
        const assignments = taskData.assignees.map(assigneeId => ({
          task_id: task.id,
          assigned_to: assigneeId,
        }));

        const { error: assignmentsError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignmentsError) throw assignmentsError;
      }

      toast({
        title: "Task assigned successfully",
        description: `Task "${taskData.title}" has been assigned to ${taskData.assignees?.length || 1} user(s).`,
      });

      return true;
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error assigning task",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskAssignment['status']) => {
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

  const getTaskAssignees = async (taskId: string): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase.rpc('get_task_assignees', { task_id: taskId });
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching task assignees:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    assignTask,
    updateTaskStatus,
    getTaskAssignees,
    refetchUsers: fetchUsers,
  };
}
