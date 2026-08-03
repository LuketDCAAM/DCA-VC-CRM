import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const DEAL_FIELDS =
  "id, company_name, sector, round_stage, pipeline_stage, location, website, description, round_size, post_money_valuation, revenue, total_funding_raised, deal_score, deal_lead, is_priority_deal, next_steps, last_call_date, updated_at";

export default defineTool({
  name: "search_deals",
  title: "Search deals",
  description:
    "Search the CRM deal pipeline by company name, sector, pipeline stage or round stage. Returns core deal fields.",
  inputSchema: {
    query: z.string().trim().optional().describe("Company name fragment to match."),
    sector: z.string().trim().optional().describe("Sector filter, matched loosely."),
    pipeline_stage: z.string().trim().optional().describe("Exact pipeline stage, e.g. 'Due Diligence'."),
    round_stage: z.string().trim().optional().describe("Exact round stage, e.g. 'Seed'."),
    priority_only: z.boolean().optional().describe("Only return deals flagged as priority."),
    limit: z.number().int().optional().describe("Max rows to return, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    let q = supabaseForUser(ctx)
      .from("deals")
      .select(DEAL_FIELDS)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (input.query) q = q.ilike("company_name", `%${input.query}%`);
    if (input.sector) q = q.ilike("sector", `%${input.sector}%`);
    if (input.pipeline_stage) q = q.eq("pipeline_stage", input.pipeline_stage);
    if (input.round_stage) q = q.eq("round_stage", input.round_stage);
    if (input.priority_only) q = q.eq("is_priority_deal", true);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, deals: data ?? [] },
    };
  },
});
