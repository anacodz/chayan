import { Resend } from "resend";
import { logger } from "./logger";
import { env } from "./env";

interface SendInviteEmailParams {
  to: string;
  name: string;
  inviteUrl: string;
}

export type InviteEmailFailureCode =
  | "MISSING_API_KEY"
  | "MISSING_VERIFIED_SENDER"
  | "INVALID_INVITE_URL"
  | "RESEND_API_ERROR"
  | "TESTMAIL_API_ERROR"
  | "TRANSIENT_RETRY_EXHAUSTED"
  | "SEND_EXCEPTION";

export interface SendInviteEmailResult {
  ok: boolean;
  attempts: number;
  failureCode?: InviteEmailFailureCode;
  failureReason?: string;
}

const TRANSIENT_ERROR_PATTERNS = [
  "timeout",
  "timed out",
  "econnreset",
  "etimedout",
  "enotfound",
  "temporarily unavailable",
  "rate limit",
  "too many requests",
  "429",
  "500",
  "502",
  "503",
  "504",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "message" in value) {
    return String((value as { message?: unknown }).message || "");
  }
  return "";
}

function isTransientFailure(value: unknown): boolean {
  const msg = asMessage(value).toLowerCase();
  if (!msg) return false;
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

/**
 * Sends an invitation email using either Resend or testmail.app.
 */
export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const resendKey = env.RESEND_API_KEY;
  const testmailKey = env.TESTMAIL_API_KEY;
  const fallbackFrom = "hiring@cuemath.com";
  const from = env.RESEND_FROM?.trim() || fallbackFrom;
  const maxAttempts = env.NODE_ENV === "production" ? 3 : 2;
  
  if (!resendKey && !testmailKey) {
    logger.error("No email API key found. Please set RESEND_API_KEY or TESTMAIL_API_KEY in .env");
    return {
      ok: false,
      attempts: 0,
      failureCode: "MISSING_API_KEY",
      failureReason: "No email provider configured",
    } satisfies SendInviteEmailResult;
  }

  if (env.NODE_ENV === "production" && !env.RESEND_FROM && !testmailKey) {
    logger.error(
      { from, fallbackFrom },
      "RESEND_FROM is required in production when using Resend."
    );
    return {
      ok: false,
      attempts: 0,
      failureCode: "MISSING_VERIFIED_SENDER",
      failureReason: "RESEND_FROM is not configured for production",
    } satisfies SendInviteEmailResult;
  }

  if (!inviteUrl.startsWith("http://") && !inviteUrl.startsWith("https://")) {
    logger.error({ inviteUrl }, "Invite email skipped: invite URL must be absolute");
    return {
      ok: false,
      attempts: 0,
      failureCode: "INVALID_INVITE_URL",
      failureReason: "Invite URL must be absolute (http/https)",
    } satisfies SendInviteEmailResult;
  }

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

  if (testmailKey) {
    return sendViaTestmail({ to, subject, html, apiKey: testmailKey, from, maxAttempts });
  }

  return sendViaResend({ to, subject, html, apiKey: resendKey!, from, maxAttempts });
}

async function sendViaTestmail({ 
  to, 
  subject, 
  html, 
  apiKey, 
  from, 
  maxAttempts 
}: { 
  to: string, 
  subject: string, 
  html: string, 
  apiKey: string, 
  from: string, 
  maxAttempts: number 
}): Promise<SendInviteEmailResult> {
  let lastFailureReason = "testmail.app API error";
  let retryableFailure = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info({ to, attempt }, "Attempting to send email via testmail.app");
      
      const response = await fetch("https://api.testmail.app/api/json/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: apiKey,
          from,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastFailureReason = errorData.message || `HTTP ${response.status}`;
        retryableFailure = isTransientFailure(lastFailureReason);

        logger.error({ error: lastFailureReason, to, attempt, maxAttempts }, "testmail.app API error");

        if (retryableFailure && attempt < maxAttempts) {
          await sleep(150 * Math.pow(2, attempt - 1));
          continue;
        }

        return {
          ok: false,
          attempts: attempt,
          failureCode: "TESTMAIL_API_ERROR",
          failureReason: lastFailureReason,
        };
      }

      logger.info({ to, attempt }, "Invite email sent successfully via testmail.app");
      return { ok: true, attempts: attempt };
    } catch (error) {
      lastFailureReason = error instanceof Error ? error.message : "Unknown error";
      retryableFailure = isTransientFailure(lastFailureReason);

      logger.error({ error: lastFailureReason, to, attempt, maxAttempts }, "testmail.app exception");

      if (retryableFailure && attempt < maxAttempts) {
        await sleep(150 * Math.pow(2, attempt - 1));
        continue;
      }

      return {
        ok: false,
        attempts: attempt,
        failureCode: "SEND_EXCEPTION",
        failureReason: lastFailureReason,
      };
    }
  }

  return {
    ok: false,
    attempts: maxAttempts,
    failureCode: "TRANSIENT_RETRY_EXHAUSTED",
    failureReason: lastFailureReason,
  };
}

async function sendViaResend({ 
  to, 
  subject, 
  html, 
  apiKey, 
  from, 
  maxAttempts 
}: { 
  to: string, 
  subject: string, 
  html: string, 
  apiKey: string, 
  from: string, 
  maxAttempts: number 
}): Promise<SendInviteEmailResult> {
  const resend = new Resend(apiKey);
  let lastFailureReason = "Resend API error";
  let retryableFailure = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info({ to, attempt }, "Attempting to send email via Resend");
      
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        lastFailureReason = asMessage(error) || "Resend API error";
        retryableFailure = isTransientFailure(error);

        logger.error({ error, to, from, attempt, maxAttempts }, "Resend API error");

        if (retryableFailure && attempt < maxAttempts) {
          await sleep(150 * Math.pow(2, attempt - 1));
          continue;
        }

        return {
          ok: false,
          attempts: attempt,
          failureCode: retryableFailure ? "TRANSIENT_RETRY_EXHAUSTED" : "RESEND_API_ERROR",
          failureReason: lastFailureReason,
        };
      }

      logger.info({ id: data?.id, to, attempt }, "Invite email sent successfully via Resend");
      return { ok: true, attempts: attempt };
    } catch (error) {
      lastFailureReason = error instanceof Error ? error.message : "Unknown error";
      retryableFailure = isTransientFailure(lastFailureReason);

      logger.error({ error: lastFailureReason, to, from, attempt, maxAttempts }, "Resend exception");

      if (retryableFailure && attempt < maxAttempts) {
        await sleep(150 * Math.pow(2, attempt - 1));
        continue;
      }

      return {
        ok: false,
        attempts: attempt,
        failureCode: retryableFailure ? "TRANSIENT_RETRY_EXHAUSTED" : "SEND_EXCEPTION",
        failureReason: lastFailureReason,
      };
    }
  }

  return {
    ok: false,
    attempts: maxAttempts,
    failureCode: "TRANSIENT_RETRY_EXHAUSTED",
    failureReason: lastFailureReason,
  };
}
