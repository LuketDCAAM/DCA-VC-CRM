import { createClient } from 'npm:@supabase/supabase-js@2';

function htmlResponse(message: string, redirectUrl?: string) {
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>Notion</title></head>
<body style="font-family:system-ui;padding:40px;text-align:center">
<h2>${message}</h2>
${redirectUrl ? `<p>Redirecting…</p><script>setTimeout(()=>{window.location.href=${JSON.stringify(redirectUrl)}},800)</script>` : ''}
</body></html>`;
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');

    if (errorParam) return htmlResponse(`Notion connection cancelled: ${errorParam}`);
    if (!code || !state) return htmlResponse('Missing code or state from Notion.');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Lookup state
    const { data: stateRow, error: stateErr } = await admin
      .from('notion_oauth_states')
      .select('user_id, expires_at')
      .eq('state', state)
      .maybeSingle();

    if (stateErr || !stateRow) return htmlResponse('Invalid or expired OAuth state.');
    if (new Date(stateRow.expires_at) < new Date()) {
      await admin.from('notion_oauth_states').delete().eq('state', state);
      return htmlResponse('OAuth state expired. Please try again.');
    }

    const userId = stateRow.user_id;
    const returnTo = state.split('|')[1] || '/settings/integrations';

    const clientId = Deno.env.get('NOTION_OAUTH_CLIENT_ID')!;
    const clientSecret = Deno.env.get('NOTION_OAUTH_CLIENT_SECRET')!;
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notion-oauth-callback`;

    const basic = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Notion token exchange failed', tokenData);
      return htmlResponse(`Token exchange failed: ${tokenData.error || tokenRes.status}`);
    }

    // Upsert connection (one per user)
    const { error: upsertErr } = await admin
      .from('user_notion_connections')
      .upsert(
        {
          user_id: userId,
          access_token: tokenData.access_token,
          bot_id: tokenData.bot_id ?? null,
          workspace_id: tokenData.workspace_id ?? null,
          workspace_name: tokenData.workspace_name ?? null,
          workspace_icon: tokenData.workspace_icon ?? null,
        },
        { onConflict: 'user_id' }
      );

    if (upsertErr) {
      console.error('Failed to save connection', upsertErr);
      return htmlResponse(`Failed to save connection: ${upsertErr.message}`);
    }

    await admin.from('notion_oauth_states').delete().eq('state', state);

    const finalUrl = returnTo && returnTo.startsWith('http') ? returnTo : null;
    return htmlResponse('Notion connected successfully!', finalUrl ?? undefined);
  } catch (e) {
    console.error('notion-oauth-callback error', e);
    return htmlResponse(`Error: ${(e as Error).message}`);
  }
});
