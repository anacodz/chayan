import { Resend } from "resend";
import { logger } from "./logger";

interface SendInviteEmailParams {
  to: string;
  name: string;
  inviteUrl: string;
}

/**
 * Sends an invitation email using the Resend API.
 */
export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    logger.error("RESEND_API_KEY is missing or using placeholder. Please set a real key in .env");
    return false;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const subject = "Invitation: Cuemath AI Tutor Screening";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1d1d1f; line-height: 1.5;">
      <div style="text-align: left; margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 900; color: #0070ff; letter-spacing: -1px; text-transform: uppercase;">Cuemath</span>
      </div>
      
      <div style="background-color: #f5f5f7; border-radius: 24px; padding: 40px; margin-bottom: 32px;">
        <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.5px; color: #000;">Ready for your next challenge, ${name}?</h2>
        <p style="font-size: 17px; margin: 0 0 32px 0; color: #424245;">We're excited to invite you to our AI-driven voice screening for the elite educator role.</p>
        
        <a href="${inviteUrl}" style="background-color: #0070ff; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 700; display: inline-block; font-size: 16px;">
          Launch Interview Portal
        </a>
      </div>
      
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #d2d2d7; text-align: center;">
        <p style="font-size: 12px; color: #86868b; margin: 0;">This invitation is intended for ${to}.</p>
        <p style="font-size: 12px; color: #86868b; margin: 8px 0 0 0;">© 2026 Cuemath Engineering</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      logger.error({ error, to }, "Resend API error");
      return false;
    }

    logger.info({ id: data?.id, to }, "Invite email sent successfully via Resend");
    return true;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown error", to }, "Failed to send email");
    return false;
  }
}
