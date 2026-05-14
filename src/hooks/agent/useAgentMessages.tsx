import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UIMessage } from "ai";

export function useAgentMessages(threadId: string | null) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!threadId) {
      setInitialMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("agent_messages")
      .select("id,role,parts,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setInitialMessages(
          (data ?? []).map((m) => ({
            id: m.id,
            role: m.role as UIMessage["role"],
            parts: (m.parts as unknown) as UIMessage["parts"],
          })),
        );
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [threadId]);

  return { initialMessages, loading };
}
