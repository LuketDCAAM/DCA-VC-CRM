import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_portfolio",
  title: "List portfolio companies",
  description: "List portfolio companies tracked in the CRM, optionally filtered by name or status.",
  inputSchema: {
    query: z.string().trim().optional().describe("Company name fragment to match."),
    status: z.string().trim().optional().describe("Exact company status value."),
    limit: z.number().int().optional().describe("Max rows, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    let q = supabaseForUser(ctx)
      .from("portfolio_companies")
      .select("id, company_name, description, status, tags, relationship_owner, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (input.query) q = q.ilike("company_name", `%${input.query}%`);
    if (input.status) q = q.eq("status", input.status);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, companies: data ?? [] },
    };
  },
});
