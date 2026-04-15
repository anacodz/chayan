import nodemailer from "nodemailer";
import { Resend } from "resend";
import { logger } from "./logger";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Mail Service configuration.
 * Uses environment variables for SMTP settings as a fallback for local dev.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "", // Get from https://ethereal.email/
    pass: process.env.SMTP_PASS || "",
  },
});

interface SendInviteEmailParams {
  to: string;
  name: string;
  inviteUrl: string;
}

/**
 * Sends an invitation email to a candidate using Resend (Production) or Nodemailer (Dev fallback).
 */
export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const subject = "Invitation: Cuemath AI Tutor Screening";
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || "hiring@cuemath.com";
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1d1d1f; line-height: 1.5;">
      <div style="text-align: left; margin-bottom: 32px;">
        <span style="font-size: 24px; font-weight: 900; color: #0070ff; letter-spacing: -1px; text-transform: uppercase;">Cuemath</span>
      </div>
      
      <div style="background-color: #f5f5f7; border-radius: 24px; padding: 40px; margin-bottom: 32px;">
        <h2 style="font-size: 28px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.5px; color: #000;">Ready for your next challenge, ${name}?</h2>
        <p style="font-size: 17px; margin: 0 0 32px 0; color: #424245;">We're excited to invite you to our AI-driven voice screening for the elite educator role. Show us your teaching style and conceptual clarity.</p>
        
        <a href="${inviteUrl}" style="background-color: #0070ff; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: 700; display: inline-block; font-size: 16px;">
          Launch Interview Portal
        </a>
      </div>
      
      <div style="padding: 0 8px;">
        <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; margin-bottom: 16px;">What to expect</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 12px; display: flex; align-items: center;">
            <div style="font-size: 15px;">• 10-15 minute voice-first interview</div>
          </li>
          <li style="margin-bottom: 12px; display: flex; align-items: center;">
            <div style="font-size: 15px;">• Scenarios focused on pedagogy and student engagement</div>
          </li>
          <li style="margin-bottom: 12px; display: flex; align-items: center;">
            <div style="font-size: 15px;">• AI-driven assessment for fair evaluation</div>
          </li>
        </ul>
      </div>
      
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #d2d2d7; text-align: center;">
        <p style="font-size: 12px; color: #86868b; margin: 0;">This invitation is intended for ${to}. The link is unique to your application and should not be shared.</p>
        <p style="font-size: 12px; color: #86868b; margin: 8px 0 0 0;">© 2026 Cuemath Engineering • Powered by Chayan</p>
      </div>
    </div>
  `;

  try {
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: `Cuemath Hiring <${from}>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      logger.info({ id: data?.id, to }, "Invite email sent successfully via Resend");
      return true;
    }

    // Fallback to Nodemailer for dev
    const info = await transporter.sendMail({
      from: `"Cuemath Hiring" <${from}>`,
      to,
      subject,
      html,
    });

    logger.info({ messageId: info.messageId, to }, "Invite email sent successfully via Nodemailer fallback");
    
    // Log preview URL for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, "Email preview URL available");
    }
    
    return true;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown error", to }, "Failed to send invite email");
    return false;
  }
}
