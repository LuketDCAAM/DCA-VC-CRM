import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
  role?: string;
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, status, role, rejectionReason }: ApprovalEmailRequest = await req.json();

    let subject = "";
    let htmlContent = "";

    if (status === 'approved') {
      subject = "Your CRM Account Has Been Approved!";
      htmlContent = `
        <h1>Welcome to the CRM, ${name}!</h1>
        <p>Great news! Your account has been approved and you can now access the CRM system.</p>
        <p><strong>Your role:</strong> ${role === 'viewer' ? 'Viewer' : 'Editor'}</p>
        ${role === 'viewer' 
          ? '<p>As a <strong>Viewer</strong>, you can view all data and analytics but cannot make changes.</p>'
          : '<p>As an <strong>Editor</strong>, you have full access to create and modify deals, contacts, and other data.</p>'
        }
        <p>You can now log in to access the system.</p>
        <p>Best regards,<br>The CRM Team</p>
      `;
    } else {
      subject = "CRM Account Application Update";
      htmlContent = `
        <h1>Account Application Update</h1>
        <p>Hi ${name},</p>
        <p>We regret to inform you that your CRM account application has been declined.</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        <p>If you have any questions, please contact the administrator.</p>
        <p>Best regards,<br>The CRM Team</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "CRM System <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
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