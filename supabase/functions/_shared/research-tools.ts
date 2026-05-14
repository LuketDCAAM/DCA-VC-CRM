// Shared research tools for the agent + analyst (Firecrawl + Notion via connector gateway).
import { tool } from "npm:ai@6.0.182";
import { z } from "npm:zod@4.4.3";

const GATEWAY = "https://connector-gateway.lovable.dev";
const FIRECRAWL_BASE = "https://api.firecrawl.dev/v2";

function lovableKey() {
  const k = Deno.env.get("LOVABLE_API_KEY");
  if (!k) throw new Error("LOVABLE_API_KEY missing");
  return k;
}

export const researchTools = () => {
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const notionKey = Deno.env.get("NOTION_API_KEY");

  const tools: Record<string, ReturnType<typeof tool>> = {};

  if (firecrawlKey) {
    tools.web_search = tool({
      description:
        "Search the public web for information about a company, founder, market, or competitor. Returns titles, URLs, and snippets.",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().int().min(1).max(10).default(5),
      }),
      execute: async ({ query, limit }) => {
        // Firecrawl is a direct-API connector; use its REST endpoint with the API key.
        const r = await fetch(`${FIRECRAWL_BASE}/search`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit }),
        });
        const j = await r.json();
        if (!r.ok) return { error: `firecrawl ${r.status}: ${JSON.stringify(j).slice(0, 300)}` };
        const web = j?.data?.web ?? j?.web ?? j?.data ?? [];
        return {
          results: (Array.isArray(web) ? web : []).slice(0, limit).map((x: Record<string, unknown>) => ({
            title: x.title,
            url: x.url,
            description: x.description ?? x.snippet,
          })),
        };
      },
    });

    tools.scrape_url = tool({
      description:
        "Fetch a single web page (company site, news article, blog) as clean markdown for deeper reading.",
      inputSchema: z.object({ url: z.string().url() }),
      execute: async ({ url }) => {
        const r = await fetch(`${FIRECRAWL_BASE}/scrape`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
        });
        const j = await r.json();
        if (!r.ok) return { error: `firecrawl ${r.status}` };
        const md = j?.data?.markdown ?? j?.markdown ?? "";
        const title = j?.data?.metadata?.title ?? j?.metadata?.title;
        return { title, url, markdown: String(md).slice(0, 12000) };
      },
    });
  }

  if (notionKey) {
    tools.notion_search_transcripts = tool({
      description:
        "Search the configured Notion call-transcripts database for pages matching a company name or keyword. Returns pageIds + titles.",
      inputSchema: z.object({
        database_id: z.string().describe("Notion database id from investment_thesis.notion_transcripts_db_id"),
        query: z.string(),
        limit: z.number().int().min(1).max(20).default(10),
      }),
      execute: async ({ database_id, query, limit }) => {
        const r = await fetch(`${GATEWAY}/notion/v1/databases/${database_id}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey()}`,
            "X-Connection-Api-Key": notionKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page_size: limit }),
        });
        const j = await r.json();
        if (!r.ok) return { error: `notion ${r.status}: ${JSON.stringify(j).slice(0, 300)}` };
        const q = query.toLowerCase();
        const results = (j.results ?? [])
          .map((p: Record<string, unknown>) => {
            const props = (p.properties ?? {}) as Record<string, { title?: { plain_text: string }[] }>;
            const titleProp = Object.values(props).find((x) => Array.isArray(x?.title));
            const title = titleProp?.title?.map((t) => t.plain_text).join("") ?? "(untitled)";
            return { id: p.id as string, title, url: p.url as string };
          })
          .filter((p: { title: string }) => !q || p.title.toLowerCase().includes(q))
          .slice(0, limit);
        return { count: results.length, pages: results };
      },
    });

    tools.notion_get_page = tool({
      description: "Fetch the full text content (blocks) of a Notion page. Use after notion_search_transcripts.",
      inputSchema: z.object({ page_id: z.string() }),
      execute: async ({ page_id }) => {
        const r = await fetch(`${GATEWAY}/notion/v1/blocks/${page_id}/children?page_size=100`, {
          headers: {
            Authorization: `Bearer ${lovableKey()}`,
            "X-Connection-Api-Key": notionKey,
          },
        });
        const j = await r.json();
        if (!r.ok) return { error: `notion ${r.status}` };
        const text = (j.results ?? [])
          .map((b: Record<string, { rich_text?: { plain_text: string }[] }>) => {
            const block = b as unknown as Record<string, unknown>;
            const type = block.type as string;
            const content = (block[type] as { rich_text?: { plain_text: string }[] } | undefined)?.rich_text;
            return content?.map((t) => t.plain_text).join("") ?? "";
          })
          .filter(Boolean)
          .join("\n\n");
        return { page_id, content: text.slice(0, 15000) };
      },
    });
  }

  return tools;
};
