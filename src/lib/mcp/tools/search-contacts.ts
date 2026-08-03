import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_contacts",
  title: "Search contacts",
  description: "Search CRM contacts by name, firm/company or email.",
  inputSchema: {
    query: z.string().trim().optional().describe("Name fragment to match."),
    company: z.string().trim().optional().describe("Company or firm fragment to match."),
    deal_id: z.string().trim().optional().describe("Restrict to contacts linked to this deal UUID."),
    limit: z.number().int().optional().describe("Max rows, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    let q = supabaseForUser(ctx)
      .from("contacts")
      .select("id, name, title, company_or_firm, email, phone, relationship_owner, deal_id, investor_id, portfolio_company_id")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (input.query) q = q.ilike("name", `%${input.query}%`);
    if (input.company) q = q.ilike("company_or_firm", `%${input.company}%`);
    if (input.deal_id) q = q.eq("deal_id", input.deal_id);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, contacts: data ?? [] },
    };
  },
});
