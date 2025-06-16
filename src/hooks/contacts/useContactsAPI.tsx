
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { Contact, CreateContactData } from '@/types/contact';

export function useContactsAPI(user: User | null) {
  const { toast } = useToast();

  const fetchContacts = async (): Promise<Contact[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Error fetching contacts",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  const addContact = async (contactData: CreateContactData): Promise<Contact | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...contactData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Contact added",
        description: "The contact has been successfully added.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact | null> => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Contact updated",
        description: "The contact has been successfully updated.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating contact",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContact = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMultipleContacts = async (ids: string[]): Promise<void> => {
    if (!user || ids.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast({
        title: "Contacts deleted",
        description: `${ids.length} contacts have been successfully deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting contacts",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    deleteMultipleContacts,
  };
}
