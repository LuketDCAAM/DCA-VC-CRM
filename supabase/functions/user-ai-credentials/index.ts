// Manage a user's own AI API keys (Anthropic, OpenAI, Google).
//   GET    ?provider=...                       -> metadata (or list of all if no provider)
//   POST   ?action=list-models { provider, api_key? }
//   POST   { provider, api_key, default_model? } -> validate + upsert
//   DELETE ?provider=...                       -> remove credential

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Provider = "anthropic" | "openai" | "google";
const PROVIDERS: Provider[] = ["anthropic", "openai", "google"];

const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
};

const KEY_PREFIX: Record<Provider, RegExp> = {
  // Anthropic keys start with sk-ant-.
  anthropic: /^sk-ant-/,
  // OpenAI: sk-... (sk-proj-, sk-svcacct-, sk-... legacy)
  openai: /^sk-[A-Za-z0-9_-]+/,
  // Google AI Studio keys are opaque alnum strings, typically starting "AIza".
  google: /^[A-Za-z0-9_\-]{20,}$/,
};

function isProvider(p: unknown): p is Provider {
  return typeof p === "string" && PROVIDERS.includes(p as Provider);
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------- Validation: ping each provider's models endpoint ----------

async function validateKey(provider: Provider, apiKey: string, model: string) {
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    return { ok: res.ok, status: res.status, body: await res.text() };
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return { ok: res.ok, status: res.status, body: await res.text() };
  }
  // google
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );
  return { ok: res.ok, status: res.status, body: await res.text() };
}

// ---------- Live model listing per provider ----------

type LiveModel = { id: string; label: string };

async function listModels(provider: Provider, apiKey: string): Promise<LiveModel[]> {
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) return [];
    const j = await res.json() as {
      data?: Array<{ id: string; display_name?: string }>;
    };
    return (j.data ?? [])
      .filter((m) => m.id?.startsWith("claude-"))
      .map((m) => ({ id: m.id, label: m.display_name ?? m.id }));
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const j = await res.json() as { data?: Array<{ id: string }> };
    return (j.data ?? [])
      .map((m) => m.id)
      // Chat-capable model families
      .filter((id) => /^(gpt-|o[0-9])/.test(id))
      // Drop fine-tunes and obviously non-chat models
      .filter((id) => !/(audio|tts|whisper|embedding|image|realtime|moderation|search|davinci|babbage|curie|ada)/i.test(id))
      .sort()
      .reverse()
      .map((id) => ({ id, label: id }));
  }
  // google
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );
  if (!res.ok) return [];
  const j = await res.json() as {
    models?: Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }>;
  };
  return (j.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => ({
      id: m.name.replace(/^models\//, ""),
      label: m.displayName ?? m.name.replace(/^models\//, ""),
    }))
    .filter((m) => m.id.startsWith("gemini-"));
}

// ---------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const user = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims } = await user.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const providerParam = url.searchParams.get("provider");

    // ----- list-models (uses stored key, or candidate from body) -----
    if (req.method === "POST" && action === "list-models") {
      const body = await req.json().catch(() => ({})) as {
        provider?: Provider; api_key?: string;
      };
      const provider = body.provider;
      if (!isProvider(provider)) return json({ error: "Invalid provider" }, 400);
      let apiKey = (body.api_key ?? "").trim();
      if (!apiKey) {
        const { data: existing } = await admin
          .from("user_ai_credentials")
          .select("encrypted_api_key")
          .eq("user_id", userId)
          .eq("provider", provider)
          .maybeSingle();
        apiKey = (existing?.encrypted_api_key as string | undefined) ?? "";
      }
      if (!apiKey) return json({ models: [] });
      return json({ models: await listModels(provider, apiKey) });
    }

    // ----- GET: metadata for one provider or all -----
    if (req.method === "GET") {
      let q = admin
        .from("user_ai_credentials")
        .select("provider, last_4, default_model, last_used_at, last_status, last_error, created_at, updated_at")
        .eq("user_id", userId);
      if (providerParam && isProvider(providerParam)) q = q.eq("provider", providerParam);
      const { data } = await q;
      if (providerParam) {
        return json({ credential: (data?.[0] as unknown) ?? null });
      }
      return json({ credentials: data ?? [] });
    }

    // ----- DELETE: remove a single provider -----
    if (req.method === "DELETE") {
      if (!isProvider(providerParam)) return json({ error: "Provider required" }, 400);
      await admin
        .from("user_ai_credentials")
        .delete()
        .eq("user_id", userId)
        .eq("provider", providerParam);
      return json({ ok: true });
    }

    // ----- POST: upsert + validate -----
    if (req.method === "POST") {
      const body = await req.json() as {
        provider?: Provider; api_key?: string; default_model?: string;
      };
      const provider = body.provider;
      if (!isProvider(provider)) return json({ error: "Invalid provider" }, 400);
      const apiKey = (body.api_key ?? "").trim();
      const model = (body.default_model ?? DEFAULT_MODEL[provider]).trim();
      if (!apiKey || !KEY_PREFIX[provider].test(apiKey)) {
        return json({ error: `That doesn't look like a valid ${provider} API key.` }, 400);
      }

      const check = await validateKey(provider, apiKey, model);
      if (!check.ok) {
        let msg = `${provider} rejected the key (${check.status}).`;
        if (check.status === 401 || check.status === 403) msg = `${provider} says this API key is invalid or lacks permission.`;
        else if (check.status === 429) msg = `${provider} rate-limited the test request. The key may still be valid — try again in a moment.`;
        else if (check.status === 404) msg = `Model "${model}" is not available on this ${provider} account.`;
        return json({ error: msg, details: check.body.slice(0, 300) }, 400);
      }

      const last_4 = apiKey.slice(-4);
      const { error: upsertErr } = await admin
        .from("user_ai_credentials")
        .upsert({
          user_id: userId,
          provider,
          encrypted_api_key: apiKey,
          last_4,
          default_model: model,
          last_used_at: new Date().toISOString(),
          last_status: "ok",
          last_error: null,
        }, { onConflict: "user_id,provider" });
      if (upsertErr) return json({ error: upsertErr.message }, 500);

      return json({ ok: true, provider, last_4, default_model: model });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("user-ai-credentials error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
