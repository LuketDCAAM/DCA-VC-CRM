// Shared helper for making Microsoft Outlook API calls through the Lovable connector gateway.
// Used by outlook-app-user, outlook-sync, outlook-push, and outlook-calendar-sync functions.

export const GATEWAY_BASE_URL = 'https://connector-gateway.lovable.dev';
export const CONNECTOR_ID = 'microsoft_outlook';

// Microsoft Graph permission names — include offline_access so the gateway can refresh tokens.
const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.ReadWrite',
  'Tasks.ReadWrite',
];

export function getScopes(): string[] {
  return [...MICROSOFT_SCOPES];
}

/**
 * Look up a user's stored connection key from the outlook_connections table.
 */
export async function getConnectionKey(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('outlook_connections')
    .select('connection_key')
    .eq('user_id', userId)
    .eq('connector_id', CONNECTOR_ID)
    .maybeSingle();

  if (error || !data) return null;
  return data.connection_key;
}

/**
 * Make a proxied API call to Microsoft Graph through the Lovable connector gateway.
 * The gateway injects the user's OAuth credentials and handles token refresh automatically.
 */
export async function gatewayProxy(
  connectionKey: string,
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {},
): Promise<Response> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Path is relative to https://graph.microsoft.com/v1.0/ — the gateway handles the base.
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${GATEWAY_BASE_URL}/${CONNECTOR_ID}${cleanPath}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': connectionKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });

  return response;
}

/**
 * Start the OAuth authorize flow via the gateway. Returns { authorization_url, session_id }.
 * Pass existingConnectionKey on reconnect.
 */
export async function gatewayAuthorize(
  userId: string,
  returnUrl: string,
  existingConnectionKey?: string,
): Promise<{ authorization_url: string; session_id: string }> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const clientApiKey = Deno.env.get('MICROSOFT_OUTLOOK_APP_USER_CONNECTOR_CLIENT_API_KEY');

  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');
  if (!clientApiKey) throw new Error('MICROSOFT_OUTLOOK_APP_USER_CONNECTOR_CLIENT_API_KEY not configured');

  const body: Record<string, any> = {
    connector_id: CONNECTOR_ID,
    app_user_id: userId,
    return_url: returnUrl,
    credentials_configuration: {
      scopes: getScopes(),
    },
  };

  if (existingConnectionKey) {
    body.connection_key = existingConnectionKey;
  }

  const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/app-users/oauth2/authorize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'X-Client-Api-Key': clientApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gateway authorize failed:', response.status, errorText);
    throw new Error(`Authorize failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Verify that a connection key is still valid by calling the gateway's verify endpoint.
 */
export async function verifyConnection(connectionKey: string): Promise<boolean> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) return false;

  try {
    const response = await fetch(`${GATEWAY_BASE_URL}/api/v1/verify_credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'X-Connection-Api-Key': connectionKey,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.outcome === 'verified' || data.outcome === 'skipped';
  } catch {
    return false;
  }
}
