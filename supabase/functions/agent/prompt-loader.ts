// Loads the agent system prompt + playbooks from adjacent markdown files.
// Cached per cold-start so there's no per-request file I/O cost.

let cached: string | null = null;

const PROMPT_FILES = [
  "prompts/system.md",
  "prompts/field-rules.md",
  "prompts/bulk-operations.md",
] as const;

const PLAYBOOK_FILES = [
  "playbooks/bulk-import-deals.md",
  "playbooks/research-company.md",
  "playbooks/weekly-review.md",
] as const;

async function readRelative(path: string): Promise<string> {
  const url = new URL(`./${path}`, import.meta.url);
  return await Deno.readTextFile(url);
}

function applySubstitutions(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export interface PromptVars {
  PIPELINE_STAGES: string;
  ROUND_STAGES: string;
  INVESTMENT_VEHICLES: string;
}

export async function loadPrompt(vars: PromptVars): Promise<string> {
  if (cached) return cached;

  const coreParts = await Promise.all(PROMPT_FILES.map(readRelative));
  const playbookParts = await Promise.all(PLAYBOOK_FILES.map(readRelative));

  const core = coreParts.join("\n\n---\n\n");
  const playbooks = playbookParts.length
    ? `\n\n---\n\n# Playbooks\n\nReference recipes — follow the one that matches the user's request.\n\n${playbookParts.join("\n\n---\n\n")}`
    : "";

  cached = applySubstitutions(core + playbooks, vars as unknown as Record<string, string>);
  return cached;
}
