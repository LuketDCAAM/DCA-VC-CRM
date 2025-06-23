
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'user';
type UserStatus = 'pending' | 'approved' | 'rejected';

interface UserApproval {
  id: string;
  user_id: string;
  status: UserStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserRoles() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      console.log('=== FETCH USER ROLES DEBUG ===');
      console.log('Fetching roles for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      console.log('User roles result:', data);
      console.log('User roles error:', error);

      if (error) throw error;
      setUserRoles(data?.map(row => row.role as UserRole) || []);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error fetching user roles",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchApprovalStatus = async () => {
    if (!user) return;

    try {
      console.log('=== FETCH APPROVAL STATUS DEBUG ===');
      console.log('Checking approval for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_approvals')
        .select('status')
        .eq('user_id', user.id)
        .single();

      console.log('Approval status result:', data);
      console.log('Approval status error:', error);

      if (error && error.code !== 'PGRST116') throw error;
      const status = data?.status as UserStatus || null;
      setApprovalStatus(status);
      
      console.log('Final approval status set to:', status);
      console.log('=== END FETCH APPROVAL STATUS DEBUG ===');
    } catch (error: any) {
      console.error('Error fetching approval status:', error);
      toast({
        title: "Error fetching approval status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchUserRoles(), fetchApprovalStatus()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const isAdmin = userRoles.includes('admin');
  const isApproved = approvalStatus === 'approved';
  const isPending = approvalStatus === 'pending';
  const isRejected = approvalStatus === 'rejected';

  console.log('=== USER ROLES STATE ===');
  console.log('User ID:', user?.id);
  console.log('User roles:', userRoles);
  console.log('Approval status:', approvalStatus);
  console.log('Is admin:', isAdmin);
  console.log('Is approved:', isApproved);
  console.log('Is pending:', isPending);
  console.log('Is rejected:', isRejected);
  console.log('Loading:', loading);

  return {
    userRoles,
    approvalStatus,
    isAdmin,
    isApproved,
    isPending,
    isRejected,
    loading,
    refetch: () => {
      fetchUserRoles();
      fetchApprovalStatus();
    }
  };
}
