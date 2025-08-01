
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
      
      console.log('=== CONFIG CHECK DEBUG ===');
      console.log('Client ID exists:', !!clientId);
      console.log('Client Secret exists:', !!clientSecret);
      
      if (!clientId || !clientSecret) {
        console.error('Missing OAuth configuration');
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
      console.error('Missing required parameters:', { code: !!code, user_id: !!user_id });
      return new Response(JSON.stringify({ 
        error: 'Missing code or user_id',
        received: { code: !!code, user_id: !!user_id }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== PROCESSING OAUTH CALLBACK ===');
    console.log('User ID:', user_id);
    console.log('Authorization code length:', code.length);
    console.log('Code starts with:', code.substring(0, 50) + '...');

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth configuration for token exchange');
      return new Response(JSON.stringify({ 
        error: 'OAuth configuration not found',
        details: 'Missing Microsoft Client ID or Client Secret'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the correct redirect URI based on the request origin
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/auth')[0] || 'https://preview--dca-vc-crm.lovable.app';
    const redirectUri = `${origin}/auth/microsoft/callback`;
    
    console.log('=== TOKEN EXCHANGE DETAILS ===');
    console.log('Origin:', origin);
    console.log('Redirect URI:', redirectUri);
    console.log('Client ID (first 8 chars):', clientId.substring(0, 8));

    // Exchange code for tokens
    const tokenRequestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/Tasks.ReadWrite https://graph.microsoft.com/Calendars.Read offline_access',
    });

    console.log('Making token request to Microsoft...');
    console.log('Request body size:', tokenRequestBody.toString().length);

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenRequestBody,
    });

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    const responseText = await tokenResponse.text();
    console.log('Token response body length:', responseText.length);
    console.log('Token response body (first 200 chars):', responseText.substring(0, 200));
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed with status:', tokenResponse.status);
      console.error('Response body:', responseText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch (e) {
        errorDetails = { raw_response: responseText };
      }
      
      return new Response(JSON.stringify({ 
        error: 'Microsoft token exchange failed', 
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        details: errorDetails,
        debug: {
          redirectUriUsed: redirectUri,
          origin: origin,
          clientIdPrefix: clientId.substring(0, 8),
          codeLength: code.length,
          responseBodyLength: responseText.length
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse token response:', e);
      return new Response(JSON.stringify({ 
        error: 'Invalid token response format',
        details: 'Could not parse JSON response from Microsoft',
        responseLength: responseText.length
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== TOKEN EXCHANGE SUCCESS ===');
    console.log('Token type:', tokenData.token_type);
    console.log('Expires in:', tokenData.expires_in);
    console.log('Scope:', tokenData.scope);
    console.log('Has access token:', !!tokenData.access_token);
    console.log('Has refresh token:', !!tokenData.refresh_token);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    console.log('Storing tokens in database...');
    console.log('Expires at:', expiresAt);
    
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
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error('Error storing tokens:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to store tokens',
        details: insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('=== AUTHENTICATION COMPLETED SUCCESSFULLY ===');
    console.log('User ID:', user_id);
    console.log('Tokens stored successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Microsoft authentication successful',
      user_id: user_id,
      debug: {
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        redirectUriUsed: redirectUri,
        origin: origin
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== MICROSOFT AUTH ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
