import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_investors",
  title: "Search investors",
  description:
    "Search the investor network by firm name, contact name, preferred sector or preferred investment stage.",
  inputSchema: {
    query: z.string().trim().optional().describe("Firm name fragment to match."),
    contact_name: z.string().trim().optional().describe("Investor contact name fragment."),
    sector: z.string().trim().optional().describe("Preferred sector to match."),
    stage: z.string().trim().optional().describe("Preferred investment stage, exact value."),
    limit: z.number().int().optional().describe("Max rows, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    let q = supabaseForUser(ctx)
      .from("investors")
      .select(
        "id, firm_name, contact_name, contact_email, firm_website, location, preferred_sectors, preferred_investment_stage, average_check_size, relationship_owner, last_call_date",
      )
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (input.query) q = q.ilike("firm_name", `%${input.query}%`);
    if (input.contact_name) q = q.ilike("contact_name", `%${input.contact_name}%`);
    if (input.sector) q = q.contains("preferred_sectors", [input.sector]);
    if (input.stage) q = q.eq("preferred_investment_stage", input.stage);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, investors: data ?? [] },
    };
  },
});
