import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types'; // Assuming your types are correctly generated

// Define a type for the user data you expect to fetch, including role and approval status
// This should match the structure returned by your 'get_all_users_with_roles' function
export interface UserWithRoleAndApproval {
  user_id: string;
  email: string;
  name: string;
  roles: Array<Tables<'user_roles'>['role']>; // Array of roles from your app_role enum
  approval_status: Tables<'user_approvals'>['status']; // Status from your user_status enum
  created_at: string;
}

export function useAllUsers() {
  const [users, setUsers] = useState<UserWithRoleAndApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Use the RPC function to get all users with their roles and approval status
      const { data, error } = await supabase.rpc('get_all_users_with_roles');

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error fetching users',
          description: error.message,
          variant: 'destructive',
        });
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching users:', err);
      toast({
        title: 'Unexpected error',
        description: err.message,
        variant: 'destructive',
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers(); // Initial fetch when component mounts

    // --- Supabase Realtime Subscription for user_roles and user_approvals ---
    // This is where the 'subscribe multiple times' error often originates.
    // We need to ensure we unsubscribe when the component unmounts or the effect re-runs.

    // 1. Subscribe to changes in the 'user_roles' table
    const rolesChannel = supabase
      .channel('public:user_roles') // Use a unique channel name for this table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        (payload) => {
          console.log('User Roles Change:', payload);
          fetchUsers(); // Refetch users on any change to user_roles
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to user_roles changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to user_roles channel');
        }
      });

    // 2. Subscribe to changes in the 'user_approvals' table
    const approvalsChannel = supabase
      .channel('public:user_approvals') // Use a unique channel name for this table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_approvals' },
        (payload) => {
          console.log('User Approvals Change:', payload);
          fetchUsers(); // Refetch users on any change to user_approvals
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to user_approvals changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to user_approvals channel');
        }
      });

    // --- Cleanup function ---
    // This is CRUCIAL to prevent multiple subscriptions.
    // When the component unmounts or the effect's dependencies change,
    // this function will run to unsubscribe from the channels.
    return () => {
      console.log('Unsubscribing from user_roles and user_approvals channels...');
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(approvalsChannel);
    };
  }, [fetchUsers]); // Depend on fetchUsers to re-run effect if it changes (due to useCallback, it won't often)

  // Function to update a user's role
  const updateUserRole = async (userId: string, newRole: Tables<'user_roles'>['role']) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'User role updated',
        description: `Role for user ${userId} set to ${newRole}.`,
      });
      fetchUsers(); // Refetch to show immediate update
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error updating role',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to update a user's approval status
  const updateUserApprovalStatus = async (userId: string, newStatus: Tables<'user_approvals'>['status'], rejectedReason: string | null = null) => {
    setLoading(true);
    try {
      const updateData: Partial<Tables<'user_approvals'>['Update']> = { 
        status: newStatus, 
        updated_at: new Date().toISOString(),
        approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
        rejected_reason: newStatus === 'rejected' ? rejectedReason : null,
      };

      const { error } = await supabase
        .from('user_approvals')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'User approval status updated',
        description: `Status for user ${userId} set to ${newStatus}.`,
      });
      fetchUsers(); // Refetch to show immediate update
    } catch (error: any) {
      console.error('Error updating user approval status:', error);
      toast({
        title: 'Error updating approval status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    refetchUsers: fetchUsers,
    updateUserRole,
    updateUserApprovalStatus,
  };
}
