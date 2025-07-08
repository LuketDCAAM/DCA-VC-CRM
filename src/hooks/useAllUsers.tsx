
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AllUsersData {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  approval_status: string;
  created_at: string;
}

export function useAllUsers() {
  const [users, setUsers] = useState<AllUsersData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAllUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_users_with_roles');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user' | 'viewer', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }

      toast({
        title: "Role updated",
        description: `User role ${action === 'add' ? 'added' : 'removed'} successfully.`,
      });

      fetchAllUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateApprovalStatus = async (userId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updates.approved_by = user?.id;
        updates.approved_at = new Date().toISOString();
      } else if (status === 'rejected' && reason) {
        updates.rejected_reason = reason;
      }

      const { error } = await supabase
        .from('user_approvals')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      // If approving a user, add default 'user' role
      if (status === 'approved') {
        await updateUserRole(userId, 'user', 'add');
      }

      toast({
        title: "Approval status updated",
        description: `User has been ${status}.`,
      });

      fetchAllUsers();
    } catch (error: any) {
      console.error('Error updating approval status:', error);
      toast({
        title: "Error updating approval",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [user]);

  return {
    users,
    loading,
    updateUserRole,
    updateApprovalStatus,
    refetch: fetchAllUsers
  };
}
