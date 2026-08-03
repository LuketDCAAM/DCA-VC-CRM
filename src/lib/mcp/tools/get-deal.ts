import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_deal",
  title: "Get deal detail",
  description:
    "Get one deal with its current investment scorecard (ARR, burn, valuation, ratings, narratives) and recent call notes. Look up by deal id or exact-ish company name.",
  inputSchema: {
    deal_id: z.string().trim().optional().describe("Deal UUID, if known."),
    company_name: z.string().trim().optional().describe("Company name to match when no id is given."),
    notes_limit: z.number().int().optional().describe("How many recent call notes to include, default 5."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    if (!input.deal_id && !input.company_name) {
      throw new ToolError("Provide either deal_id or company_name");
    }
    const supabase = supabaseForUser(ctx);

    let dealQuery = supabase.from("deals").select("*").limit(1);
    dealQuery = input.deal_id
      ? dealQuery.eq("id", input.deal_id)
      : dealQuery.ilike("company_name", `%${input.company_name}%`);

    const { data: deals, error } = await dealQuery;
    if (error) throw new ToolError(error.message);
    const deal = deals?.[0];
    if (!deal) throw new ToolError("No matching deal found");

    const notesLimit = Math.min(Math.max(input.notes_limit ?? 5, 1), 25);
    const [{ data: scorecard }, { data: notes }] = await Promise.all([
      supabase
        .from("deal_scorecards")
        .select("*")
        .eq("deal_id", deal.id)
        .eq("is_current", true)
        .maybeSingle(),
      supabase
        .from("call_notes")
        .select("id, title, call_date, content")
        .eq("deal_id", deal.id)
        .order("call_date", { ascending: false })
        .limit(notesLimit),
    ]);

    const payload = { deal, scorecard: scorecard ?? null, call_notes: notes ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
