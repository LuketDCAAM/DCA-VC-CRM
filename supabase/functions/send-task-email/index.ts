import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TaskEmailRequest {
  task_id: string;
  task_title: string;
  task_description?: string;
  due_date: string;
  priority: string;
  assignee_emails: string[];
  assignee_names: string[];
  creator_name: string;
  creator_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      task_id,
      task_title, 
      task_description, 
      due_date, 
      priority,
      assignee_emails,
      assignee_names,
      creator_name,
      creator_email
    }: TaskEmailRequest = await req.json();

    console.log("Sending task emails for task:", task_id, "to:", assignee_emails);

    if (!assignee_emails || assignee_emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No assignee emails provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const priorityColors: Record<string, string> = {
      low: "#22c55e",
      medium: "#f59e0b",
      high: "#f97316",
      urgent: "#ef4444",
    };

    const priorityColor = priorityColors[priority] || "#6b7280";
    const formattedDate = new Date(due_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email to each assignee
    const emailPromises = assignee_emails.map((email, index) => {
      const assigneeName = assignee_names[index] || email.split('@')[0];
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
            .task-card { background: #f9fafb; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .due-date { color: #6b7280; font-size: 14px; margin-top: 10px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">New Task Assigned</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You have been assigned a new task</p>
            </div>
            <div class="content">
              <p>Hi ${assigneeName},</p>
              <p><strong>${creator_name}</strong> has assigned you a new task:</p>
              
              <div class="task-card">
                <h2 style="margin: 0 0 10px 0; font-size: 18px;">${task_title}</h2>
                ${task_description ? `<p style="color: #4b5563; margin: 0 0 15px 0;">${task_description}</p>` : ''}
                <span class="priority-badge" style="background-color: ${priorityColor};">${priority}</span>
                <p class="due-date">📅 Due: ${formattedDate}</p>
              </div>
              
              <p>Please log in to the CRM to view and manage this task.</p>
              
              <p style="margin-top: 30px;">Best regards,<br>The CRM Team</p>
            </div>
            <div class="footer">
              <p>This is an automated notification from your CRM system.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return resend.emails.send({
        from: "CRM Tasks <onboarding@resend.dev>",
        to: [email],
        subject: `New Task Assigned: ${task_title}`,
        html: htmlContent,
      });
    });

    const results = await Promise.all(emailPromises);
    console.log("Task emails sent successfully:", results);

    // Update the reminder to mark email as sent
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('reminders')
      .update({ 
        email_sent: true, 
        email_sent_at: new Date().toISOString() 
      })
      .eq('id', task_id);

    return new Response(JSON.stringify({ success: true, sent_count: results.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-task-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
