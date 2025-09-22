import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesUpdate } from '@/integrations/supabase/types'; // Assuming your types are correctly generated, added TablesUpdate

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
  
  // Move useRef to top level of the hook
  const rolesChannelRef = useRef<any>(null);
  const approvalsChannelRef = useRef<any>(null);

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
        // Explicitly cast the data to the expected type
        setUsers((data || []) as UserWithRoleAndApproval[]);
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

    // Simplified subscription management

    // Clean up existing channels
    if (rolesChannelRef.current) {
      try {
        supabase.removeChannel(rolesChannelRef.current);
      } catch (error) {
        // Silently handle cleanup errors
      }
      rolesChannelRef.current = null;
    }
    
    if (approvalsChannelRef.current) {
      try {
        supabase.removeChannel(approvalsChannelRef.current);
      } catch (error) {
        // Silently handle cleanup errors
      }
      approvalsChannelRef.current = null;
    }

    // Create new subscriptions with unique channel names
    const rolesChannel = supabase.channel(`user_roles_${Date.now()}_${Math.random()}`);
    const approvalsChannel = supabase.channel(`user_approvals_${Date.now()}_${Math.random()}`);
    
    rolesChannelRef.current = rolesChannel;
    approvalsChannelRef.current = approvalsChannel;

    rolesChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          try {
            fetchUsers();
          } catch (error) {
            // Silently handle refetch errors
          }
        }
      )
      .subscribe();

    approvalsChannel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_approvals' },
        () => {
          try {
            fetchUsers();
          } catch (error) {
            // Silently handle refetch errors
          }
        }
      )
      .subscribe();

    return () => {
      if (rolesChannelRef.current) {
        try {
          supabase.removeChannel(rolesChannelRef.current);
        } catch (error) {
          // Silently handle cleanup errors
        }
        rolesChannelRef.current = null;
      }
      
      if (approvalsChannelRef.current) {
        try {
          supabase.removeChannel(approvalsChannelRef.current);
        } catch (error) {
          // Silently handle cleanup errors
        }
        approvalsChannelRef.current = null;
      }
    };
  }, [fetchUsers]); // Depend on fetchUsers to re-run effect if it changes (due to useCallback, it won't often)

  // Function to update a user's role
  const updateUserRole = async (userId: string, newRole: Tables<'user_roles'>['role']) => {
    setLoading(true);
    try {
      // Ensure a single, authoritative role assignment
      // 1) Remove existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      if (deleteError) throw deleteError;

      // 2) Insert the selected role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });
      if (insertError) throw insertError;

      toast({
        title: 'User role updated',
        description: `Role for user ${userId} set to ${newRole}.`,
      });
      fetchUsers();
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

  // Function to update a user's approval status and send email
  const updateUserApprovalStatus = async (
    userId: string, 
    status: 'approved' | 'rejected',
    role?: Tables<'user_roles'>['role'],
    rejectionReason?: string
  ) => {
    setLoading(true);
    console.log('Starting approval process for user:', userId, 'status:', status);
    
    try {
      // First update the approval status
      console.log('Updating approval status...');
      const { error: approvalError } = await supabase
        .from('user_approvals')
        .upsert({ 
          user_id: userId, 
          status,
          rejection_reason: rejectionReason 
        });

      if (approvalError) {
        console.error('Approval status update failed:', approvalError);
        throw new Error(`Failed to update approval status: ${approvalError.message}`);
      }
      
      console.log('Approval status updated successfully');

      // If approved and role provided, assign the role
      if (status === 'approved' && role) {
        console.log('Assigning role:', role);
        
        // Delete existing roles first
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.error('Role deletion failed:', deleteError);
          throw new Error(`Failed to clear existing roles: ${deleteError.message}`);
        }

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (roleError) {
          console.error('Role assignment failed:', roleError);
          throw new Error(`Failed to assign role: ${roleError.message}`);
        }
        
        console.log('Role assigned successfully');
      }

      // Find user details for email
      const user = users.find(u => u.user_id === userId);
      if (user) {
        console.log('Sending approval email to:', user.email);
        
        // Send approval email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
          body: {
            email: user.email,
            name: user.name,
            status,
            role,
            rejectionReason
          }
        });

        // Log email error but don't fail the approval process
        if (emailError) {
          console.warn('Failed to send approval email:', emailError);
          toast({
            title: `User ${status} successfully`,
            description: `Approval completed but email notification failed. Please notify the user manually.`,
            variant: 'default'
          });
        } else {
          console.log('Email sent successfully');
          toast({
            title: `User ${status} successfully`,
            description: `User has been ${status} and notified via email.`,
          });
        }
      } else {
        console.log('User not found for email notification');
        toast({
          title: `User ${status} successfully`,
          description: `User has been ${status}.`,
        });
      }

      console.log('Refetching users...');
      fetchUsers(); // Refetch to show immediate update
    } catch (error: any) {
      console.error('Error in approval process:', error);
      
      // Provide more specific error messages
      let errorMessage = 'An unexpected error occurred';
      if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
        errorMessage = 'You do not have permission to perform this action. Please ensure you have admin privileges.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error updating approval status',
        description: errorMessage,
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
