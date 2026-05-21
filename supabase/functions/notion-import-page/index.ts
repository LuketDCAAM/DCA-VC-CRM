import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/notion/v1';

type EntityType = 'deal' | 'investor' | 'portfolio_company';

function richTextToPlain(rich: any[]): string {
  if (!Array.isArray(rich)) return '';
  return rich.map((r) => r.plain_text || '').join('');
}

function blockToText(block: any): string {
  const t = block.type;
  const data = block[t];
  const indent = '  '.repeat(Math.max(0, (block._depth || 0)));
  const line = (s: string) => (s ? indent + s : '');
  if (!data) return '';
  switch (t) {
    case 'paragraph':
    case 'quote':
    case 'callout':
      return line(richTextToPlain(data.rich_text));
    case 'heading_1':
      return line(`# ${richTextToPlain(data.rich_text)}`);
    case 'heading_2':
      return line(`## ${richTextToPlain(data.rich_text)}`);
    case 'heading_3':
      return line(`### ${richTextToPlain(data.rich_text)}`);
    case 'bulleted_list_item':
      return line(`- ${richTextToPlain(data.rich_text)}`);
    case 'numbered_list_item':
      return line(`1. ${richTextToPlain(data.rich_text)}`);
    case 'to_do':
      return line(`${data.checked ? '[x]' : '[ ]'} ${richTextToPlain(data.rich_text)}`);
    case 'toggle':
      return line(richTextToPlain(data.rich_text));
    case 'code':
      return line('```\n' + richTextToPlain(data.rich_text) + '\n```');
    case 'divider':
      return line('---');
    case 'child_page':
      return line(`# ${data.title || ''}`);
    case 'bookmark':
    case 'embed':
    case 'link_preview':
      return line(data.url || '');
    default:
      if (data.rich_text) return line(richTextToPlain(data.rich_text));
      return '';
  }
}

async function fetchAllBlocks(
  pageId: string,
  headers: Record<string, string>,
  depth = 0,
): Promise<any[]> {
  if (depth > 4) return [];
  const all: any[] = [];
  let cursor: string | undefined;
  do {
    const url = new URL(`${GATEWAY_URL}/blocks/${pageId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);
    const r = await fetch(url.toString(), { headers });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.message || 'Failed to fetch blocks');
    for (const block of d.results || []) {
      all.push({ ...block, _depth: depth });
      if (block.has_children) {
        // For synced_block, fetch from the synced source if it points elsewhere
        let childId = block.id;
        if (block.type === 'synced_block' && block.synced_block?.synced_from?.block_id) {
          childId = block.synced_block.synced_from.block_id;
        }
        try {
          const children = await fetchAllBlocks(childId, headers, depth + 1);
          all.push(...children);
        } catch (_) {
          // ignore child fetch failures (e.g., unsupported block types)
        }
      }
    }
    cursor = d.has_more ? d.next_cursor : undefined;
  } while (cursor);
  return all;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
    if (!LOVABLE_API_KEY || !NOTION_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Notion is not connected.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const pageIds: string[] = Array.isArray(body.pageIds) ? body.pageIds : [];
    const entityType: EntityType = body.entityType;
    const entityId: string = body.entityId;

    if (!pageIds.length || !entityType || !entityId) {
      return new Response(JSON.stringify({ error: 'pageIds, entityType, entityId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': NOTION_API_KEY,
      'Content-Type': 'application/json',
    };

    const fieldMap: Record<EntityType, string> = {
      deal: 'deal_id',
      investor: 'investor_id',
      portfolio_company: 'portfolio_company_id',
    };

    const inserted: any[] = [];

    for (const pageId of pageIds) {
      // Get page meta for title + date
      const pageResp = await fetch(`${GATEWAY_URL}/pages/${pageId}`, { headers });
      const page = await pageResp.json();
      if (!pageResp.ok) {
        return new Response(JSON.stringify({ error: page?.message || 'Failed to fetch page', pageId }), {
          status: pageResp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let title = 'Untitled (Notion)';
      const props = page.properties || {};
      for (const key of Object.keys(props)) {
        const prop = props[key];
        if (prop?.type === 'title' && Array.isArray(prop.title) && prop.title.length) {
          title = prop.title.map((t: any) => t.plain_text).join('') || title;
          break;
        }
      }

      const blocks = await fetchAllBlocks(pageId, headers);
      const content = blocks.map(blockToText).filter(Boolean).join('\n\n');
      const callDate = (page.created_time || new Date().toISOString()).slice(0, 10);

      const insertRow: Record<string, unknown> = {
        title,
        content: content + (page.url ? `\n\n---\nSource: ${page.url}` : ''),
        call_date: callDate,
        created_by: userData.user.id,
        [fieldMap[entityType]]: entityId,
      };

      const { data, error } = await supabase.from('call_notes').insert(insertRow).select().single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message, pageId }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      inserted.push(data);
    }

    return new Response(JSON.stringify({ inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
