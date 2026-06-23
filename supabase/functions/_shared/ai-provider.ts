// Shared AI provider resolver — supports BYOK for Anthropic, OpenAI, and Google,
// with the Lovable AI Gateway as the workspace-billed fallback.

import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@2.0.47";
import { createAnthropic } from "npm:@ai-sdk/anthropic@2.0.42";
import { createOpenAI } from "npm:@ai-sdk/openai@2.0.50";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google@2.0.31";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

export type Provider = "anthropic" | "openai" | "google";

export type CredentialRow = {
  user_id: string;
  provider: Provider;
  encrypted_api_key: string;
  default_model: string;
};

export type ResolvedModel = {
  // deno-lint-ignore no-explicit-any
  model: any;
  provider: Provider | "lovable";
  modelId: string;
  userId: string | null;
  hasUserCredential: boolean;
};

export const PROVIDER_DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
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

/** Return the first connected BYOK credential for this user (any provider). */
export async function loadUserCredential(
  userId: string | null,
): Promise<CredentialRow | null> {
  if (!userId) return null;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await admin
    .from("user_ai_credentials")
    .select("user_id, provider, encrypted_api_key, default_model")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CredentialRow | null) ?? null;
}

export async function resolveUserModel(opts: {
  userId: string | null;
  fallbackModelId?: string;
}): Promise<ResolvedModel> {
  const fallback = opts.fallbackModelId ?? "google/gemini-3-flash-preview";
  const cred = await loadUserCredential(opts.userId);
  if (cred?.encrypted_api_key) {
    const modelId = cred.default_model || PROVIDER_DEFAULT_MODEL[cred.provider];
    if (cred.provider === "anthropic") {
      return {
        model: createAnthropic({ apiKey: cred.encrypted_api_key })(modelId),
        provider: "anthropic",
        modelId,
        userId: opts.userId,
        hasUserCredential: true,
      };
    }
    if (cred.provider === "openai") {
      return {
        model: createOpenAI({ apiKey: cred.encrypted_api_key })(modelId),
        provider: "openai",
        modelId,
        userId: opts.userId,
        hasUserCredential: true,
      };
    }
    if (cred.provider === "google") {
      return {
        model: createGoogleGenerativeAI({ apiKey: cred.encrypted_api_key })(modelId),
        provider: "google",
        modelId,
        userId: opts.userId,
        hasUserCredential: true,
      };
    }
  }
  return {
    model: lovableGateway()(fallback),
    provider: "lovable",
    modelId: fallback,
    userId: opts.userId,
    hasUserCredential: false,
  };
}

export async function markCredentialUsed(
  userId: string,
  provider: Provider,
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
      .eq("provider", provider);
  } catch (_) { /* swallow */ }
}

// -----------------------------------------------------------------------
// Raw single-tool-call helper used by score-deal & fill-scorecard-blanks.
// Routes to the user's chosen provider, or to the Lovable Gateway fallback.
// All three BYOK providers expose an OpenAI-compatible chat-completions
// surface that supports `tool_choice: { type: "function" }`, except Anthropic
// which uses its native Messages API with `tool_choice: { type: "tool" }`.
// -----------------------------------------------------------------------

export type SingleToolCallParams = {
  userId: string | null;
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  parameters: Record<string, unknown>;
  fallbackModelId?: string;
};

export type SingleToolCallResult = {
  args: Record<string, unknown>;
  provider: Provider | "lovable";
  modelId: string;
};

async function callOpenAICompatibleTool(opts: {
  url: string;
  apiKey: string;
  modelId: string;
  system: string;
  user: string;
  toolName: string;
  toolDescription: string;
  parameters: Record<string, unknown>;
}) {
  const res = await fetch(opts.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.modelId,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      tools: [{
        type: "function",
        function: {
          name: opts.toolName,
          description: opts.toolDescription,
          parameters: opts.parameters,
        },
      }],
      tool_choice: { type: "function", function: { name: opts.toolName } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err: Error & { status?: number } = new Error(
      `${opts.url} ${res.status}: ${text.slice(0, 400)}`,
    );
    err.status = res.status;
    throw err;
  }
  const j = await res.json();
  const tc = j.choices?.[0]?.message?.tool_calls?.[0];
  if (!tc) throw new Error("Response had no tool_call");
  return JSON.parse(tc.function.arguments) as Record<string, unknown>;
}

export async function callSingleTool(
  p: SingleToolCallParams,
): Promise<SingleToolCallResult> {
  const cred = await loadUserCredential(p.userId);

  if (cred?.encrypted_api_key) {
    const modelId = cred.default_model || PROVIDER_DEFAULT_MODEL[cred.provider];
    try {
      let args: Record<string, unknown>;
      if (cred.provider === "anthropic") {
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
        if (!toolBlock) throw new Error("Anthropic response had no tool_use block");
        args = (toolBlock.input ?? {}) as Record<string, unknown>;
      } else if (cred.provider === "openai") {
        args = await callOpenAICompatibleTool({
          url: "https://api.openai.com/v1/chat/completions",
          apiKey: cred.encrypted_api_key,
          modelId,
          system: p.system,
          user: p.user,
          toolName: p.toolName,
          toolDescription: p.toolDescription,
          parameters: p.parameters,
        });
      } else {
        // Google Gemini: OpenAI-compatible endpoint.
        args = await callOpenAICompatibleTool({
          url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          apiKey: cred.encrypted_api_key,
          modelId,
          system: p.system,
          user: p.user,
          toolName: p.toolName,
          toolDescription: p.toolDescription,
          parameters: p.parameters,
        });
      }
      if (p.userId) await markCredentialUsed(p.userId, cred.provider, "ok");
      return { args, provider: cred.provider, modelId };
    } catch (e) {
      if (p.userId) {
        await markCredentialUsed(
          p.userId,
          cred.provider,
          "error",
          (e as Error).message.slice(0, 500),
        );
      }
      throw e;
    }
  }

  // Lovable Gateway fallback
  const modelId = p.fallbackModelId ?? "google/gemini-2.5-flash";
  const args = await callOpenAICompatibleTool({
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    apiKey: LOVABLE_API_KEY,
    modelId,
    system: p.system,
    user: p.user,
    toolName: p.toolName,
    toolDescription: p.toolDescription,
    parameters: p.parameters,
  });
  return { args, provider: "lovable", modelId };
}
