// Shared AI provider resolver.
//
// Returns an AI SDK model bound to either:
//   (a) the calling user's own Anthropic key (BYOK — billed to them), or
//   (b) the Lovable AI Gateway fallback (billed to the workspace).
//
// Also exposes a low-level chat-completions caller so the older
// raw-fetch edge functions can route to whichever provider is active.

import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@2.0.47";
import { createAnthropic } from "npm:@ai-sdk/anthropic@2.0.42";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

export type CredentialRow = {
  user_id: string;
  provider: "anthropic";
  encrypted_api_key: string;
  default_model: string;
};

export type ResolvedModel = {
  // deno-lint-ignore no-explicit-any
  model: any;
  provider: "anthropic" | "lovable";
  modelId: string;
  userId: string | null;
  hasUserCredential: boolean;
};

function lovableGateway() {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": LOVABLE_API_KEY,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

export async function loadUserCredential(
  userId: string | null,
): Promise<CredentialRow | null> {
  if (!userId) return null;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await admin
    .from("user_ai_credentials")
    .select("user_id, provider, encrypted_api_key, default_model")
    .eq("user_id", userId)
    .eq("provider", "anthropic")
    .maybeSingle();
  return (data as CredentialRow | null) ?? null;
}

/**
 * Returns an AI SDK model for the caller. If they've connected their own
 * Anthropic key, uses Claude with their key. Otherwise falls back to the
 * Lovable Gateway (default Gemini Flash, or a caller-supplied model id).
 */
export async function resolveUserModel(opts: {
  userId: string | null;
  fallbackModelId?: string;
}): Promise<ResolvedModel> {
  const fallback = opts.fallbackModelId ?? "google/gemini-3-flash-preview";
  const cred = await loadUserCredential(opts.userId);
  if (cred?.encrypted_api_key) {
    const anthropic = createAnthropic({ apiKey: cred.encrypted_api_key });
    const modelId = cred.default_model || "claude-sonnet-4-5";
    return {
      model: anthropic(modelId),
      provider: "anthropic",
      modelId,
      userId: opts.userId,
      hasUserCredential: true,
    };
  }
  return {
    model: lovableGateway()(fallback),
    provider: "lovable",
    modelId: fallback,
    userId: opts.userId,
    hasUserCredential: false,
  };
}

/**
 * Mark the user's credential as used (or errored). Best-effort.
 */
export async function markCredentialUsed(
  userId: string,
  status: "ok" | "error",
  error?: string | null,
) {
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await admin
      .from("user_ai_credentials")
      .update({
        last_used_at: new Date().toISOString(),
        last_status: status,
        last_error: error ?? null,
      })
      .eq("user_id", userId)
      .eq("provider", "anthropic");
  } catch (_) { /* swallow */ }
}

// -----------------------------------------------------------------------
// Raw chat-completions style call used by score-deal & fill-scorecard-blanks.
// Returns the JSON object the model produced via a single forced tool call.
// -----------------------------------------------------------------------

export type SingleToolCallParams = {
  userId: string | null;
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  // JSON schema (OpenAI-tool style) for the forced tool call
  parameters: Record<string, unknown>;
  // Lovable-gateway fallback model id (when user has no BYOK)
  fallbackModelId?: string;
};

export type SingleToolCallResult = {
  args: Record<string, unknown>;
  provider: "anthropic" | "lovable";
  modelId: string;
};

export async function callSingleTool(
  p: SingleToolCallParams,
): Promise<SingleToolCallResult> {
  const cred = await loadUserCredential(p.userId);

  if (cred?.encrypted_api_key) {
    const modelId = cred.default_model || "claude-sonnet-4-5";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cred.encrypted_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 8000,
        system: p.system,
        messages: [{ role: "user", content: p.user }],
        tools: [{
          name: p.toolName,
          description: p.toolDescription,
          input_schema: p.parameters,
        }],
        tool_choice: { type: "tool", name: p.toolName },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      if (p.userId) {
        await markCredentialUsed(p.userId, "error", text.slice(0, 500));
      }
      const err: Error & { status?: number } = new Error(
        `Anthropic ${res.status}: ${text.slice(0, 400)}`,
      );
      err.status = res.status;
      throw err;
    }
    const json = await res.json() as {
      content: Array<{ type: string; name?: string; input?: unknown }>;
    };
    const toolBlock = json.content.find((c) => c.type === "tool_use");
    if (!toolBlock) {
      throw new Error("Anthropic response had no tool_use block");
    }
    if (p.userId) await markCredentialUsed(p.userId, "ok");
    return {
      args: (toolBlock.input ?? {}) as Record<string, unknown>,
      provider: "anthropic",
      modelId,
    };
  }

  // Lovable Gateway fallback (OpenAI-compatible chat completions)
  const modelId = p.fallbackModelId ?? "google/gemini-2.5-flash";
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: p.user },
      ],
      tools: [{
        type: "function",
        function: {
          name: p.toolName,
          description: p.toolDescription,
          parameters: p.parameters,
        },
      }],
      tool_choice: { type: "function", function: { name: p.toolName } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err: Error & { status?: number } = new Error(
      `Lovable Gateway ${res.status}: ${text.slice(0, 400)}`,
    );
    err.status = res.status;
    throw err;
  }
  const j = await res.json();
  const tc = j.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) throw new Error("Gateway response had no tool_call");
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(tc.function.arguments);
  } catch {
    throw new Error("Gateway tool_call returned invalid JSON");
  }
  return { args, provider: "lovable", modelId };
}
