
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_email?: string;
}

export function useUserApprovals() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_approvals')
        .select(`
          id,
          user_id,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // We can't directly join with auth.users, so we'll get user emails separately
      const usersData = data || [];
      const userIds = usersData.map(u => u.user_id);
      
      // For now, we'll just show the user IDs. In a real app, you might want to 
      // store additional user info in a profiles table
      setPendingUsers(usersData.map(user => ({
        ...user,
        user_email: `User ${user.user_id.slice(0, 8)}...` // Placeholder
      })));
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error fetching pending users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error: approvalError } = await supabase
        .from('user_approvals')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (approvalError) throw approvalError;

      // Add user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'user'
        });

      if (roleError) throw roleError;

      toast({
        title: "User approved",
        description: "User has been approved and can now access the CRM.",
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: "Error approving user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectUser = async (userId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('user_approvals')
        .update({
          status: 'rejected',
          rejected_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User rejected",
        description: "User has been rejected and cannot access the CRM.",
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error rejecting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [user]);

  return {
    pendingUsers,
    loading,
    approveUser,
    rejectUser,
    refetch: fetchPendingUsers
  };
}
