
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    console.log('Microsoft auth request body:', body);

    // Handle config check
    if (body.action === 'check_config') {
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
      
      console.log('Config check - Client ID exists:', !!clientId);
      console.log('Config check - Client Secret exists:', !!clientSecret);
      
      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ 
          error: 'Microsoft OAuth configuration missing',
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        clientId,
        configured: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle OAuth callback
    const { code, user_id } = body;

    if (!code || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing code or user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing OAuth callback for user:', user_id);

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth configuration');
      return new Response(JSON.stringify({ error: 'OAuth configuration not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${req.headers.get('origin') || 'http://localhost:3000'}/auth/microsoft/callback`,
        scope: 'https://graph.microsoft.com/Tasks.ReadWrite https://graph.microsoft.com/Calendars.Read offline_access',
      }),
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(JSON.stringify({ error: 'Token exchange failed', details: errorText }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, expires in:', tokenData.expires_in);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Store tokens in database
    const { error: insertError } = await supabase
      .from('microsoft_tokens')
      .upsert({
        user_id: user_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        scope: tokenData.scope,
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing tokens:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Microsoft authentication completed successfully for user:', user_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Microsoft auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
