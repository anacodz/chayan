import nodemailer from "nodemailer";
import { logger } from "./logger";

/**
 * Mail Service configuration.
 * Uses environment variables for SMTP settings.
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
 * Sends an invitation email to a candidate.
 */
export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const mailOptions = {
    from: `"Cuemath Hiring" <${process.env.SMTP_FROM || "hiring@cuemath.com"}>`,
    to,
    subject: "Invitation: Cuemath AI Tutor Screening",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #002e6e;">Welcome to Cuemath!</h2>
        <p>Hello ${name},</p>
        <p>We are excited to invite you to the first stage of our tutor screening process. This is an AI-driven voice interview designed to understand your teaching style and pedagogy.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteUrl}" style="background-color: #0070ff; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Start Interview
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          <strong>Important Instructions:</strong><br/>
          • Ensure you are in a quiet room.<br/>
          • Use a browser with microphone access (Chrome/Safari recommended).<br/>
          • The link expires in 7 days.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;"/>
        <p style="color: #999; font-size: 12px; text-align: center;">
          Powered by Chayan • Cuemath Engineering
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to }, "Invite email sent successfully");
    
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
