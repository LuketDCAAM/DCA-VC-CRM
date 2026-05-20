import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePendingActionCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count: c } = await supabase
        .from("agent_actions")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (active) setCount(c ?? 0);
    };
    load();
    const channel = supabase
      .channel("pending_actions_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_actions" }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
