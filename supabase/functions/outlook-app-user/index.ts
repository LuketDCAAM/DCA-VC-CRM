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

      // Push a saved outreach draft into the owner's Outlook Drafts folder.
      case 'create_outreach_draft': {
        const { target, id } = body;
        if (!id || (target !== 'follow_up' && target !== 'batch_item')) {
          return new Response(JSON.stringify({ error: "Provide target ('follow_up' or 'batch_item') and id" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const table = target === 'follow_up' ? 'outreach_follow_ups' : 'outreach_batch_items';
        const { data: row, error: rowError } = await serviceClient
          .from(table)
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (rowError || !row) {
          return new Response(JSON.stringify({ error: rowError?.message || 'Draft not found' }), {
            status: rowError ? 500 : 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (row.owner_id !== user.id && row.created_by !== user.id) {
          return new Response(JSON.stringify({ error: 'Not your draft' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (!row.subject || !row.body) {
          return new Response(JSON.stringify({ error: 'Write the draft before sending it to Outlook' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Resolve the recipient address.
        let recipient: string | null = row.contact_email ?? null;
        if (!recipient && row.investor_id) {
          const { data: inv } = await serviceClient
            .from('investors')
            .select('contact_email')
            .eq('id', row.investor_id)
            .maybeSingle();
          recipient = inv?.contact_email ?? null;
        }
        if (!recipient && row.deal_id) {
          const { data: deal } = await serviceClient
            .from('deals')
            .select('contact_email')
            .eq('id', row.deal_id)
            .maybeSingle();
          recipient = deal?.contact_email ?? null;
        }

        const key = await getConnectionKey(serviceClient, user.id);
        if (!key) {
          await serviceClient
            .from(table)
            .update({ sync_status: 'not_connected', sync_error: 'Outlook is not connected yet' })
            .eq('id', id);
          return new Response(JSON.stringify({ error: 'Outlook is not connected yet', sync_status: 'not_connected' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const message: Record<string, unknown> = {
          subject: row.subject,
          body: { contentType: 'Text', content: row.body },
          isDraft: true,
        };
        if (recipient) {
          message.toRecipients = [{ emailAddress: { address: recipient } }];
        }

        const response = await gatewayProxy(key, '/me/messages', { method: 'POST', body: message });
        const text = await response.text();
        if (!response.ok) {
          console.error(`Outlook draft creation failed [${response.status}]: ${text}`);
          await serviceClient
            .from(table)
            .update({ sync_status: 'error', sync_error: text.slice(0, 500) })
            .eq('id', id);
          return new Response(JSON.stringify({ error: 'Outlook rejected the draft', status: response.status, details: text }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const created = JSON.parse(text || '{}');
        await serviceClient
          .from(table)
          .update({
            outlook_draft_id: created.id ?? null,
            outlook_web_link: created.webLink ?? null,
            sync_status: 'synced',
            sync_error: null,
          })
          .eq('id', id);

        return new Response(JSON.stringify({ success: true, draft_id: created.id, web_link: created.webLink }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
