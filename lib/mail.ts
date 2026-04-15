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
 * Sends an invitation email using the Resend API.
 */
export async function sendInviteEmail({ to, name, inviteUrl }: SendInviteEmailParams) {
  const apiKey = env.RESEND_API_KEY;
  const fallbackFrom = "hiring@cuemath.com";
  const from = env.RESEND_FROM?.trim() || "onboarding@resend.dev";
  const maxAttempts = env.NODE_ENV === "production" ? 3 : 2;
  
  if (!apiKey || apiKey === "re_xxxxxxxxx") {
    logger.error("RESEND_API_KEY is missing or using placeholder. Please set a real key in .env");
    return {
      ok: false,
      attempts: 0,
      failureCode: "MISSING_API_KEY",
      failureReason: "RESEND_API_KEY is missing or placeholder",
    } satisfies SendInviteEmailResult;
  }

  if (env.NODE_ENV === "production" && !env.RESEND_FROM) {
    logger.warn("RESEND_FROM not set in production, using default onboarding address.");
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

  logger.info({ 
    to, 
    from,
    keyPrefix: apiKey.substring(0, 5) 
  }, "Attempting to send email via Resend");

  const resend = new Resend(apiKey);
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

  let lastFailureReason = "Resend API error";
  let retryableFailure = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
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
        } satisfies SendInviteEmailResult;
      }

      logger.info({ id: data?.id, to, attempt }, "Invite email sent successfully via Resend");
      return { ok: true, attempts: attempt } satisfies SendInviteEmailResult;
    } catch (error) {
      lastFailureReason = error instanceof Error ? error.message : "Unknown error";
      retryableFailure = isTransientFailure(error);

      logger.error({ error: lastFailureReason, to, from, attempt, maxAttempts }, "Failed to send email");

      if (retryableFailure && attempt < maxAttempts) {
        await sleep(150 * Math.pow(2, attempt - 1));
        continue;
      }

      return {
        ok: false,
        attempts: attempt,
        failureCode: retryableFailure ? "TRANSIENT_RETRY_EXHAUSTED" : "SEND_EXCEPTION",
        failureReason: lastFailureReason,
      } satisfies SendInviteEmailResult;
    }
  }

  return {
    ok: false,
    attempts: maxAttempts,
    failureCode: retryableFailure ? "TRANSIENT_RETRY_EXHAUSTED" : "SEND_EXCEPTION",
    failureReason: lastFailureReason,
  } satisfies SendInviteEmailResult;
}
