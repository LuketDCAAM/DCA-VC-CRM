
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

interface Contact {
  id: string;
  name: string;
  title: string | null;
  company_or_firm: string | null;
  email: string | null;
  phone: string | null;
  deal_id: string | null;
  investor_id: string | null;
  portfolio_company_id: string | null;
  relationship_owner: string | null;
  created_at: string;
  updated_at: string;
}

// Global subscription state to prevent multiple subscriptions
let globalChannel: any = null;
let subscribers: Set<() => void> = new Set();

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const refetchRef = useRef<() => void>();

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching contacts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Store the refetch function in ref so it can be called from subscription
  refetchRef.current = fetchContacts;

  const addContact = async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

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

      setContacts(prev => [data, ...prev]);
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

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => 
        prev.map(contact => 
          contact.id === id ? { ...contact, ...data } : contact
        )
      );

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

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => contact.id !== id));
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

  const deleteMultipleContacts = async (ids: string[]) => {
    if (!user || ids.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setContacts(prev => prev.filter(contact => !ids.includes(contact.id)));
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchContacts();

    // Add this instance's refetch function to subscribers
    const refetchFunction = () => {
      if (refetchRef.current) {
        refetchRef.current();
      }
    };
    subscribers.add(refetchFunction);

    // Set up global subscription only if it doesn't exist
    if (!globalChannel && user) {
      console.log('Setting up global contacts subscription');
      const channelName = `contacts-global-${user.id}`;
      
      globalChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contacts'
          },
          () => {
            // Notify all subscribers to refetch
            subscribers.forEach(subscriber => subscriber());
          }
        )
        .subscribe();
    }

    // Cleanup function
    return () => {
      subscribers.delete(refetchFunction);
      
      // Only remove the global channel if no more subscribers
      if (subscribers.size === 0 && globalChannel) {
        console.log('Cleaning up global contacts subscription');
        supabase.removeChannel(globalChannel);
        globalChannel = null;
      }
    };
  }, [user?.id]);

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    deleteMultipleContacts,
    refetch: fetchContacts,
  };
}
