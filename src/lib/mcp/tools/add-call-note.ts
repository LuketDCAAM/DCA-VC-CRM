import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_call_note",
  title: "Add call note",
  description:
    "Add a call note / meeting note to a deal, investor or portfolio company in the CRM. Content is markdown.",
  inputSchema: {
    title: z.string().trim().describe("Short note title, e.g. 'Intro call with founders'."),
    content: z.string().trim().describe("Note body in markdown."),
    call_date: z.string().trim().optional().describe("Date of the call as YYYY-MM-DD. Defaults to today."),
    deal_id: z.string().trim().optional().describe("Deal UUID to attach the note to."),
    investor_id: z.string().trim().optional().describe("Investor UUID to attach the note to."),
    portfolio_company_id: z.string().trim().optional().describe("Portfolio company UUID to attach the note to."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Could not resolve the signed-in user");
    if (!input.deal_id && !input.investor_id && !input.portfolio_company_id) {
      throw new ToolError("Provide one of deal_id, investor_id or portfolio_company_id");
    }

    const { data, error } = await supabaseForUser(ctx)
      .from("call_notes")
      .insert({
        title: input.title,
        content: input.content,
        call_date: input.call_date ?? new Date().toISOString().slice(0, 10),
        deal_id: input.deal_id ?? null,
        investor_id: input.investor_id ?? null,
        portfolio_company_id: input.portfolio_company_id ?? null,
        created_by: userId,
      })
      .select("id, title, call_date")
      .single();

    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Created call note "${data.title}" (${data.id})` }],
      structuredContent: { note: data },
    };
  },
});
