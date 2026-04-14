import { randomBytes, createHash } from "crypto";
import prisma from "./prisma";

/**
 * Generate a random token for an invite.
 * Returns both the raw token (to be sent to the candidate) and its SHA-256 hash (to be stored in the DB).
 */
export function generateInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  const hash = hashToken(token);
  return { token, hash };
}

/**
 * Hash a token using SHA-256.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new interview session for a candidate.
 */
export async function createInvite(candidateId: string, questionSetId: string, expiresDays: number = 7) {
  const { token, hash } = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);

  const session = await prisma.interviewSession.create({
    data: {
      candidateId,
      questionSetId,
      inviteTokenHash: hash,
      inviteExpiresAt: expiresAt,
      status: "INVITED",
    },
  });

  return { session, token };
}

/**
 * Validate an invite token and return the associated session.
 */
export async function validateInvite(token: string) {
  const hash = hashToken(token);
  const session = await prisma.interviewSession.findUnique({
    where: { inviteTokenHash: hash },
    include: { 
      candidate: true,
      answers: {
        include: {
          transcript: true,
          evaluation: true,
          question: true,
        },
        orderBy: { createdAt: "asc" },
      },
      finalReport: true,
    },
  });

  if (!session) {
    return { valid: false, error: "Invite not found" };
  }

  if (new Date() > session.inviteExpiresAt) {
    return { valid: false, error: "Invite has expired", session };
  }

  return { valid: true, session };
}
