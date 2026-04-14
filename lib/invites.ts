import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import prisma from "./prisma";
import { env } from "./env";

const SECRET = new TextEncoder().encode(env.INVITE_TOKEN_SECRET);

/**
 * Generate a signed JWT for an invite.
 */
export async function createInviteToken(payload: { candidateId: string; sessionId: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

/**
 * Verify a signed JWT.
 */
export async function verifyInviteToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { valid: true, payload: payload as { candidateId: string; sessionId: string } };
  } catch (error) {
    return { valid: false, error };
  }
}

/**
 * Hash a token (JWT) using SHA-256 for storage in the DB.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new interview session for a candidate.
 * Returns the session and the raw signed JWT.
 */
export async function createInvite(candidateId: string, questionSetId: string, expiresDays: number = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);

  // We need the session ID for the JWT payload, so we create the session first with a placeholder hash
  const session = await prisma.interviewSession.create({
    data: {
      candidateId,
      questionSetId,
      inviteTokenHash: "temp-" + Math.random().toString(36).substring(7),
      inviteExpiresAt: expiresAt,
      status: "INVITED",
    },
  });

  const token = await createInviteToken({ candidateId, sessionId: session.id });
  const hash = hashToken(token);

  // Update session with the actual hash of the JWT
  const updatedSession = await prisma.interviewSession.update({
    where: { id: session.id },
    data: { inviteTokenHash: hash },
  });

  return { session: updatedSession, token };
}

/**
 * Validate an invite token (JWT) and return the associated session.
 */
export async function validateInvite(token: string) {
  // 1. Verify JWT signature and expiration
  const verification = await verifyInviteToken(token);
  if (!verification.valid) {
    return { valid: false, error: "Invalid or expired token signature" };
  }

  // 2. Check if the hash exists in the database
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
    return { valid: false, error: "Invite session not found in database" };
  }

  // Double check expiration from DB just in case it differs from JWT
  if (new Date() > session.inviteExpiresAt) {
    return { valid: false, error: "Invite has expired", session };
  }

  return { valid: true, session };
}
