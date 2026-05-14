import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AgentThread {
  id: string;
  title: string;
  updated_at: string;
}

export function useAgentThreads() {
  const [threads, setThreads] = useState<AgentThread[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase
      .from("agent_threads")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    setThreads(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const createThread = async (title = "New conversation") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("agent_threads")
      .insert({ title, user_id: user.id })
      .select("id,title,updated_at")
      .single();
    if (error) return null;
    setThreads((t) => [data, ...t]);
    return data as AgentThread;
  };

  const deleteThread = async (id: string) => {
    await supabase.from("agent_threads").delete().eq("id", id);
    setThreads((t) => t.filter((x) => x.id !== id));
  };

  const renameThread = async (id: string, title: string) => {
    await supabase.from("agent_threads").update({ title }).eq("id", id);
    setThreads((t) => t.map((x) => (x.id === id ? { ...x, title } : x)));
  };

  return { threads, loading, refresh, createThread, deleteThread, renameThread };
}
