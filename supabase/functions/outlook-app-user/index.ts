import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';
import { CONNECTOR_ID, getConnectionKey, gatewayProxy, gatewayAuthorize } from '../_shared/outlook-gateway.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the user's JWT to get their identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a user-scoped client to verify the JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service client for DB operations (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    switch (action) {
      case 'authorize': {
        const returnUrl = body.return_url || `${new URL(req.url).origin}/auth/outlook/callback`;
        const existingKey = await getConnectionKey(serviceClient, user.id);
        const result = await gatewayAuthorize(user.id, returnUrl, existingKey || undefined);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'store': {
        const { connection_key } = body;
        if (!connection_key || typeof connection_key !== 'string') {
          return new Response(JSON.stringify({ error: 'Missing connection_key' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await serviceClient
          .from('outlook_connections')
          .upsert({
            user_id: user.id,
            connection_key,
            connector_id: CONNECTOR_ID,
          }, { onConflict: 'user_id,connector_id' });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        const key = await getConnectionKey(serviceClient, user.id);
        return new Response(JSON.stringify({ connected: !!key }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disconnect': {
        await serviceClient
          .from('outlook_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('connector_id', CONNECTOR_ID);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'proxy': {
        const { path, method, body: apiBody, headers: apiHeaders } = body;
        if (!path) {
          return new Response(JSON.stringify({ error: 'Missing path' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const key = await getConnectionKey(serviceClient, user.id);
        if (!key) {
          return new Response(JSON.stringify({ error: 'Not connected to Outlook' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const response = await gatewayProxy(key, path, {
          method: method || 'GET',
          body: apiBody,
          headers: apiHeaders,
        });

        const data = await response.text();
        return new Response(data, {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
          },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('outlook-app-user error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
