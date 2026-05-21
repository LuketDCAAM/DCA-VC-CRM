import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/notion/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
    if (!LOVABLE_API_KEY || !NOTION_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Notion is not connected. Please connect Notion in Integrations.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { query = '' } = await req.json().catch(() => ({}));

    const resp = await fetch(`${GATEWAY_URL}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': NOTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: String(query).slice(0, 200),
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 50,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data?.message || 'Notion search failed', details: data }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pages = (data.results || []).map((p: any) => {
      let title = 'Untitled';
      const props = p.properties || {};
      for (const key of Object.keys(props)) {
        const prop = props[key];
        if (prop?.type === 'title' && Array.isArray(prop.title) && prop.title.length) {
          title = prop.title.map((t: any) => t.plain_text).join('') || title;
          break;
        }
      }
      return {
        id: p.id,
        title,
        url: p.url,
        last_edited_time: p.last_edited_time,
        icon: p.icon?.emoji || null,
      };
    });

    return new Response(JSON.stringify({ pages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
