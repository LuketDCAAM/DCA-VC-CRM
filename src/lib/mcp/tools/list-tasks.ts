import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "List tasks and reminders",
  description:
    "List CRM tasks/reminders visible to the signed-in user, optionally filtered to open items, a due-date window, or a specific deal.",
  inputSchema: {
    open_only: z.boolean().optional().describe("Only return tasks that are not completed. Default true."),
    deal_id: z.string().trim().optional().describe("Restrict to one deal UUID."),
    due_before: z.string().trim().optional().describe("Only tasks due on or before this date (YYYY-MM-DD)."),
    due_after: z.string().trim().optional().describe("Only tasks due on or after this date (YYYY-MM-DD)."),
    limit: z.number().int().optional().describe("Max rows, default 25, max 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    let q = supabaseForUser(ctx)
      .from("reminders")
      .select(
        "id, title, description, reminder_date, priority, status, task_type, is_completed, deal_id, investor_id, portfolio_company_id, assigned_to",
      )
      .order("reminder_date", { ascending: true })
      .limit(limit);

    if (input.open_only !== false) q = q.eq("is_completed", false);
    if (input.deal_id) q = q.eq("deal_id", input.deal_id);
    if (input.due_before) q = q.lte("reminder_date", input.due_before);
    if (input.due_after) q = q.gte("reminder_date", input.due_after);

    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, tasks: data ?? [] },
    };
  },
});
