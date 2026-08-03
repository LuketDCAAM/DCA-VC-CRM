import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create task",
  description:
    "Create a follow-up task / reminder in the CRM, optionally linked to a deal, investor or portfolio company.",
  inputSchema: {
    title: z.string().trim().describe("Task title."),
    reminder_date: z.string().trim().describe("Due date as YYYY-MM-DD."),
    description: z.string().trim().optional().describe("Optional detail for the task."),
    priority: z.string().trim().optional().describe("Priority such as low, medium or high."),
    task_type: z.string().trim().optional().describe("Task type label, e.g. 'Follow-up'."),
    deal_id: z.string().trim().optional().describe("Deal UUID to link."),
    investor_id: z.string().trim().optional().describe("Investor UUID to link."),
    portfolio_company_id: z.string().trim().optional().describe("Portfolio company UUID to link."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Could not resolve the signed-in user");

    const { data, error } = await supabaseForUser(ctx)
      .from("reminders")
      .insert({
        title: input.title,
        description: input.description ?? null,
        reminder_date: input.reminder_date,
        priority: input.priority ?? null,
        task_type: input.task_type ?? null,
        deal_id: input.deal_id ?? null,
        investor_id: input.investor_id ?? null,
        portfolio_company_id: input.portfolio_company_id ?? null,
        assigned_to: userId,
        created_by: userId,
        is_completed: false,
      })
      .select("id, title, reminder_date")
      .single();

    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Created task "${data.title}" due ${data.reminder_date} (${data.id})` }],
      structuredContent: { task: data },
    };
  },
});
