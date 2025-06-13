
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
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
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReminders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('created_by', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching reminders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (reminderData: {
    title: string;
    description?: string;
    reminder_date: string;
    deal_id?: string;
    portfolio_company_id?: string;
    investor_id?: string;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .insert({
          ...reminderData,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Reminder created",
        description: "Your reminder has been successfully created.",
      });

      fetchReminders();
    } catch (error: any) {
      toast({
        title: "Error creating reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reminder updated",
        description: "Your reminder has been successfully updated.",
      });

      fetchReminders();
    } catch (error: any) {
      toast({
        title: "Error updating reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reminder deleted",
        description: "Your reminder has been successfully deleted.",
      });

      fetchReminders();
    } catch (error: any) {
      toast({
        title: "Error deleting reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  return {
    reminders,
    loading,
    createReminder,
    updateReminder,
    deleteReminder,
    refetch: fetchReminders,
  };
}
