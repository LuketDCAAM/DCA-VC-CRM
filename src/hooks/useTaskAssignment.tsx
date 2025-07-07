
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
  assigned_to: string;
  deal_id?: string;
  portfolio_company_id?: string;
  investor_id?: string;
  task_type: 'reminder' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
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
      const { error } = await supabase
        .from('reminders')
        .insert({
          title: taskData.title,
          description: taskData.description,
          reminder_date: taskData.reminder_date,
          assigned_to: taskData.assigned_to,
          deal_id: taskData.deal_id,
          portfolio_company_id: taskData.portfolio_company_id,
          investor_id: taskData.investor_id,
          task_type: taskData.task_type,
          priority: taskData.priority,
          status: taskData.status,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      toast({
        title: "Task assigned successfully",
        description: `Task "${taskData.title}" has been assigned.`,
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

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    assignTask,
    updateTaskStatus,
    refetchUsers: fetchUsers,
  };
}
