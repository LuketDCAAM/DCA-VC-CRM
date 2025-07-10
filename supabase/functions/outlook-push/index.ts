
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushRequest {
  user_id: string;
  reminder_id: string;
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

    const { user_id, reminder_id }: PushRequest = await req.json();

    if (!user_id || !reminder_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id or reminder_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's Microsoft token
    const { data: tokenData, error: tokenError } = await supabase
      .from('microsoft_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Microsoft token not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get reminder details
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminder_id)
      .eq('created_by', user_id)
      .single();

    if (reminderError || !reminder) {
      return new Response(JSON.stringify({ error: 'Reminder not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    if (new Date() >= new Date(tokenData.expires_at)) {
      accessToken = await refreshToken(supabase, tokenData);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create task in Microsoft Graph
    const outlookTask = {
      title: reminder.title,
      body: {
        content: reminder.description || '',
        contentType: 'text',
      },
      dueDateTime: {
        dateTime: new Date(reminder.reminder_date + 'T09:00:00').toISOString(),
        timeZone: 'UTC',
      },
      status: reminder.is_completed ? 'completed' : 'notStarted',
    };

    const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists/tasks/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outlookTask),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Failed to create Outlook task:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create task in Outlook' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const createdTask = await createResponse.json();

    // Update reminder with Outlook task ID
    await supabase
      .from('reminders')
      .update({
        outlook_task_id: createdTask.id,
        outlook_created_date: createdTask.createdDateTime,
        outlook_modified_date: createdTask.lastModifiedDateTime,
        outlook_last_sync: new Date().toISOString(),
        sync_status: 'synced',
      })
      .eq('id', reminder_id);

    console.log(`Successfully pushed reminder ${reminder_id} to Outlook as task ${createdTask.id}`);

    return new Response(JSON.stringify({ 
      success: true,
      outlook_task_id: createdTask.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Outlook push error:', error);
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

    if (!clientId || !clientSecret) {
      console.error('Missing OAuth configuration for token refresh');
      return null;
    }

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Tasks.ReadWrite offline_access',
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', await response.text());
      return null;
    }

    const newTokenData = await response.json();
    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000).toISOString();

    // Update stored tokens
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
