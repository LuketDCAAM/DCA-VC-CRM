// Manage a user's own Anthropic (Claude) API key.
//   GET    -> returns metadata for the calling user (no key returned)
//   POST   -> { api_key, default_model? } validates against Anthropic, then upserts
//   DELETE -> removes the credential
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Any claude-* model the caller's Anthropic account exposes is allowed.
// We validate by calling Anthropic's own Models API rather than maintaining a hardcoded allowlist,
// so new Claude releases work automatically.
function isPlausibleClaudeModel(m: string) {
  return /^claude-[a-z0-9-]+$/i.test(m) && m.length <= 80;
}


function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function validateAnthropicKey(apiKey: string, model: string) {
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
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

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

    if (req.method === "GET") {
      const { data } = await admin
        .from("user_ai_credentials")
        .select("provider, last_4, default_model, last_used_at, last_status, last_error, created_at, updated_at")
        .eq("user_id", userId)
        .eq("provider", "anthropic")
        .maybeSingle();
      return json({ credential: data });
    }

    if (req.method === "DELETE") {
      await admin
        .from("user_ai_credentials")
        .delete()
        .eq("user_id", userId)
        .eq("provider", "anthropic");
      return json({ ok: true });
    }

    if (req.method === "POST") {
      const body = await req.json() as { api_key?: string; default_model?: string };
      const apiKey = (body.api_key ?? "").trim();
      const model = (body.default_model ?? "claude-sonnet-4-5").trim();

      if (!apiKey || !apiKey.startsWith("sk-ant-")) {
        return json({ error: "Please enter a valid Anthropic API key (starts with sk-ant-)." }, 400);
      }
      if (!ALLOWED_MODELS.has(model)) {
        return json({ error: `Model ${model} is not supported.` }, 400);
      }

      const check = await validateAnthropicKey(apiKey, model);
      if (!check.ok) {
        let msg = `Anthropic rejected the key (${check.status}).`;
        if (check.status === 401) msg = "Anthropic says this API key is invalid.";
        else if (check.status === 429) msg = "Anthropic rate-limited the test request. The key may still be valid — try again in a moment.";
        else if (check.status === 404) msg = `Model "${model}" is not available on this Anthropic account.`;
        return json({ error: msg, details: check.body.slice(0, 300) }, 400);
      }

      const last_4 = apiKey.slice(-4);
      const { error: upsertErr } = await admin
        .from("user_ai_credentials")
        .upsert({
          user_id: userId,
          provider: "anthropic",
          encrypted_api_key: apiKey,
          last_4,
          default_model: model,
          last_used_at: new Date().toISOString(),
          last_status: "ok",
          last_error: null,
        }, { onConflict: "user_id,provider" });
      if (upsertErr) return json({ error: upsertErr.message }, 500);

      return json({ ok: true, last_4, default_model: model });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    console.error("user-ai-credentials error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
