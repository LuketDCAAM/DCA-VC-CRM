
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CalendarSyncRequest {
  user_id: string;
  sync_type: 'full' | 'incremental';
}

interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  organizer?: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  body?: {
    content: string;
    contentType: string;
  };
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

    const { user_id, sync_type }: CalendarSyncRequest = await req.json();

    if (!user_id || !sync_type) {
      return new Response(JSON.stringify({ error: 'Missing user_id or sync_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('outlook_calendar_sync_logs')
      .insert({
        user_id: user_id,
        sync_type: sync_type,
        status: 'started',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError || !syncLog) {
      console.error('Failed to create calendar sync log:', logError);
      return new Response(JSON.stringify({ error: 'Failed to create sync log' }), {
        status: 500,
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
      await updateSyncLog(supabase, syncLog.id, 'failed', 'No Microsoft token found');
      return new Response(JSON.stringify({ error: 'Microsoft token not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
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

    // Fetch calendar events from Microsoft Graph (last 30 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    
    const calendarUrl = `https://graph.microsoft.com/v1.0/me/events?` +
      `$filter=start/dateTime ge '${startDate.toISOString()}' and start/dateTime le '${endDate.toISOString()}'&` +
      `$select=id,subject,start,end,attendees,organizer,body&` +
      `$orderby=start/dateTime desc&` +
      `$top=100`;

    const eventsResponse = await fetch(calendarUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('Microsoft Graph API error:', errorText);
      await updateSyncLog(supabase, syncLog.id, 'failed', 'Microsoft Graph API error');
      return new Response(JSON.stringify({ error: 'Failed to fetch calendar events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventsData = await eventsResponse.json();
    const calendarEvents: CalendarEvent[] = eventsData.value || [];

    let eventsProcessed = 0;
    let dealsUpdated = 0;

    // Get all deals for this user
    const { data: userDeals, error: dealsError } = await supabase
      .from('deals')
      .select('id, company_name, contact_email, last_call_date')
      .eq('created_by', user_id);

    if (dealsError) {
      console.error('Error fetching user deals:', dealsError);
      await updateSyncLog(supabase, syncLog.id, 'failed', 'Failed to fetch user deals');
      return new Response(JSON.stringify({ error: 'Failed to fetch user deals' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process calendar events and match with deals
    for (const event of calendarEvents) {
      try {
        eventsProcessed++;
        
        // Extract potential company names and emails from event
        const eventSubject = event.subject.toLowerCase();
        const attendeeEmails = event.attendees?.map(a => a.emailAddress.address.toLowerCase()) || [];
        const organizerEmail = event.organizer?.emailAddress.address.toLowerCase();
        
        // Find matching deals
        const matchingDeals = userDeals?.filter(deal => {
          // Match by company name in subject
          const companyMatch = eventSubject.includes(deal.company_name.toLowerCase());
          
          // Match by contact email
          const emailMatch = deal.contact_email && (
            attendeeEmails.includes(deal.contact_email.toLowerCase()) ||
            organizerEmail === deal.contact_email.toLowerCase()
          );
          
          return companyMatch || emailMatch;
        }) || [];

        // Update matching deals with the event date as last_call_date
        for (const deal of matchingDeals) {
          const eventDate = new Date(event.start.dateTime).toISOString().split('T')[0];
          
          // Only update if this event is more recent than the current last_call_date
          if (!deal.last_call_date || new Date(eventDate) > new Date(deal.last_call_date)) {
            await supabase
              .from('deals')
              .update({ 
                last_call_date: eventDate,
                updated_at: new Date().toISOString()
              })
              .eq('id', deal.id);
            
            dealsUpdated++;
            console.log(`Updated deal ${deal.company_name} with call date ${eventDate}`);
          }
        }
      } catch (error) {
        console.error('Error processing calendar event:', event.id, error);
      }
    }

    // Update sync log
    await updateSyncLog(supabase, syncLog.id, 'completed', null, eventsProcessed, dealsUpdated);

    console.log(`Calendar sync completed for user ${user_id}: ${eventsProcessed} events processed, ${dealsUpdated} deals updated`);

    return new Response(JSON.stringify({ 
      success: true, 
      events_processed: eventsProcessed,
      deals_updated: dealsUpdated 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Outlook calendar sync error:', error);
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
        scope: 'https://graph.microsoft.com/Tasks.ReadWrite https://graph.microsoft.com/Calendars.Read offline_access',
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

async function updateSyncLog(
  supabase: any,
  logId: string,
  status: string,
  errorMessage?: string | null,
  eventsProcessed?: number,
  dealsUpdated?: number
) {
  await supabase
    .from('outlook_calendar_sync_logs')
    .update({
      status: status,
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
      events_processed: eventsProcessed,
      deals_updated: dealsUpdated,
    })
    .eq('id', logId);
}
