import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';
import { getConnectionKey, gatewayProxy } from '../_shared/outlook-gateway.ts';

interface SyncRequest {
  user_id: string;
  sync_type: 'full' | 'incremental';
}

interface OutlookTask {
  id: string;
  title: string;
  body?: { content: string };
  dueDateTime?: { dateTime: string };
  status: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
}

Deno.serve(async (req) => {
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

    const { user_id, sync_type }: SyncRequest = await req.json();

    if (!user_id || !sync_type) {
      return new Response(JSON.stringify({ error: 'Missing user_id or sync_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('outlook_sync_logs')
      .insert({
        user_id: user_id,
        sync_type: sync_type,
        status: 'started',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !syncLog) {
      return new Response(JSON.stringify({ error: 'Failed to create sync log' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for gateway connection key first (new flow)
    const connectionKey = await getConnectionKey(supabase, user_id);

    let tasksResponse: Response;

    if (connectionKey) {
      // Use gateway proxy (token refresh handled automatically)
      tasksResponse = await gatewayProxy(connectionKey, '/me/todo/lists/tasks/tasks');
    } else {
      // Fall back to legacy microsoft_tokens approach
      const { data: tokenData, error: tokenError } = await supabase
        .from('microsoft_tokens')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (tokenError || !tokenData) {
        await updateSyncLog(supabase, syncLog.id, 'failed', 'No Outlook connection found');
        return new Response(JSON.stringify({ error: 'Outlook connection not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let accessToken = tokenData.access_token;
      if (new Date() >= new Date(tokenData.expires_at)) {
        accessToken = await refreshToken(supabase, tokenData);
        if (!accessToken) {
          await updateSyncLog(supabase, syncLog.id, 'failed', 'Failed to refresh token');
          return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      tasksResponse = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (!tasksResponse.ok) {
      const errorText = await tasksResponse.text();
      console.error('Microsoft Graph API error:', errorText);
      await updateSyncLog(supabase, syncLog.id, 'failed', 'Microsoft Graph API error');
      return new Response(JSON.stringify({ error: 'Failed to fetch tasks from Outlook' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tasksData = await tasksResponse.json();
    const outlookTasks: OutlookTask[] = tasksData.value || [];

    let itemsProcessed = 0;
    let itemsFailed = 0;

    for (const outlookTask of outlookTasks) {
      try {
        const reminderDate = outlookTask.dueDateTime?.dateTime
          ? new Date(outlookTask.dueDateTime.dateTime).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        const isCompleted = outlookTask.status === 'completed';

        const { data: existingReminder } = await supabase
          .from('reminders')
          .select('id, outlook_last_sync, outlook_modified_date')
          .eq('outlook_task_id', outlookTask.id)
          .eq('created_by', user_id)
          .single();

        if (existingReminder) {
          const outlookModified = new Date(outlookTask.lastModifiedDateTime);
          const lastSync = existingReminder.outlook_last_sync ? new Date(existingReminder.outlook_last_sync) : new Date(0);

          if (outlookModified > lastSync) {
            await supabase
              .from('reminders')
              .update({
                title: outlookTask.title,
                description: outlookTask.body?.content || null,
                reminder_date: reminderDate,
                is_completed: isCompleted,
                outlook_last_sync: new Date().toISOString(),
                outlook_modified_date: outlookTask.lastModifiedDateTime,
                sync_status: 'synced',
              })
              .eq('id', existingReminder.id);
          }
        } else {
          await supabase
            .from('reminders')
            .insert({
              title: outlookTask.title,
              description: outlookTask.body?.content || null,
              reminder_date: reminderDate,
              is_completed: isCompleted,
              created_by: user_id,
              outlook_task_id: outlookTask.id,
              outlook_created_date: outlookTask.createdDateTime,
              outlook_modified_date: outlookTask.lastModifiedDateTime,
              outlook_last_sync: new Date().toISOString(),
              sync_status: 'synced',
              task_type: 'reminder',
              priority: 'medium',
              status: isCompleted ? 'completed' : 'pending',
            });
        }

        itemsProcessed++;
      } catch (error) {
        console.error('Error syncing task:', outlookTask.id, error);
        itemsFailed++;
      }
    }

    await updateSyncLog(supabase, syncLog.id, 'completed', null, itemsProcessed, itemsFailed);

    return new Response(JSON.stringify({
      success: true,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Outlook sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshToken(supabase: any, tokenData: any): Promise<string | null> {
  try {
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!clientId || !clientSecret) return null;

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Tasks.ReadWrite offline_access',
      }),
    });

    if (!response.ok) return null;

    const newTokenData = await response.json();
    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();

    await supabase
      .from('microsoft_tokens')
      .update({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', tokenData.user_id);

    return newTokenData.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function updateSyncLog(
  supabase: any,
  logId: string,
  status: string,
  errorMessage?: string | null,
  itemsProcessed?: number,
  itemsFailed?: number,
) {
  await supabase
    .from('outlook_sync_logs')
    .update({
      status: status,
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
      items_processed: itemsProcessed,
      items_failed: itemsFailed,
    })
    .eq('id', logId);
}
