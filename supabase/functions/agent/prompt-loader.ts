// Loads the agent system prompt + playbooks from the `agent_prompts` table.
// Cached in-process with a short TTL so approved edits show up quickly.
import { createClient } from "npm:@supabase/supabase-js@2";

const TTL_MS = 30_000;
let cache: { value: string; expires: number } | null = null;

export interface PromptVars {
  PIPELINE_STAGES: string;
  ROUND_STAGES: string;
  INVESTMENT_VEHICLES: string;
}

function applySubstitutions(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function invalidatePromptCache(): void {
  cache = null;
}

export async function loadPrompt(vars: PromptVars): Promise<string> {
  if (cache && cache.expires > Date.now()) return cache.value;

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await db
    .from("agent_prompts")
    .select("kind,body,sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    throw new Error(`Failed to load agent prompts: ${error?.message ?? "no rows"}`);
  }

  const prompts = data.filter((r) => r.kind === "prompt").map((r) => r.body as string);
  const playbooks = data.filter((r) => r.kind === "playbook").map((r) => r.body as string);

  const core = prompts.join("\n\n---\n\n");
  const playbookSection = playbooks.length
    ? `\n\n---\n\n# Playbooks\n\nReference recipes — follow the one that matches the user's request.\n\n${playbooks.join("\n\n---\n\n")}`
    : "";

  const value = applySubstitutions(core + playbookSection, vars as unknown as Record<string, string>);
  cache = { value, expires: Date.now() + TTL_MS };
  return value;
}
