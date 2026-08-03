
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

    console.log('Starting scheduled calendar sync for all users...');

    // Get all users who have gateway connections (new flow)
    const { data: connData, error: connError } = await supabase
      .from('outlook_connections')
      .select('user_id')
      .eq('connector_id', 'microsoft_outlook');

    // Also get users with legacy microsoft_tokens (old flow)
    const { data: tokenData } = await supabase
      .from('microsoft_tokens')
      .select('user_id')
      .gte('expires_at', new Date().toISOString());

    if (connError) {
      console.error('Error fetching Outlook connections:', connError);
    }

    // Combine both lists, deduplicating by user_id
    const connUsers = (connData || []).map((r: any) => r.user_id);
    const tokenUsers = (tokenData || []).map((r: any) => r.user_id);
    const allUserIds = [...new Set([...connUsers, ...tokenUsers])];

    if (allUserIds.length === 0) {
      console.log('No active Outlook integrations found');
      return new Response(JSON.stringify({ message: 'No active integrations' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalSynced = 0;
    let totalFailed = 0;

    // Process each user
    for (const token of tokenData) {
      try {
        console.log(`Syncing calendar for user: ${token.user_id}`);
        
        const { data, error } = await supabase.functions.invoke('outlook-calendar-sync', {
          body: {
            user_id: token.user_id,
            sync_type: 'incremental'
          }
        });

        if (error) {
          console.error(`Calendar sync failed for user ${token.user_id}:`, error);
          totalFailed++;
        } else {
          console.log(`Calendar sync completed for user ${token.user_id}`);
          totalSynced++;
        }

        // Add small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error syncing calendar for user ${token.user_id}:`, error);
        totalFailed++;
      }
    }

    console.log(`Scheduled calendar sync completed. Success: ${totalSynced}, Failed: ${totalFailed}`);

    return new Response(JSON.stringify({ 
      message: 'Scheduled sync completed',
      total_users: tokenData.length,
      successful_syncs: totalSynced,
      failed_syncs: totalFailed
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scheduled calendar sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
