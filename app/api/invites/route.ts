import { NextResponse } from "next/server";
import { createInvite } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * POST /api/invites
 * Creates a new candidate and an invite for them.
 */
export async function POST(request: Request) {
  const requestId = uuidv4();
  try {
    const { name, email, questionSetId = "default" } = await request.json();

    if (!name || !email) {
      logger.warn({ requestId }, "Invite creation attempt with missing data");
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    logger.info({ requestId, email }, "Processing invite creation");

    // Upsert candidate
    let candidate = await prisma.candidate.findUnique({ where: { email } });
    if (!candidate) {
      candidate = await prisma.candidate.create({ data: { name, email } });
      logger.info({ requestId, candidateId: candidate.id }, "New candidate created");
    }

    const { session, token } = await createInvite(candidate.id, questionSetId);
    logger.info({ requestId, sessionId: session.id }, "Invite session created");

    const baseUrl = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const inviteUrl = `${baseUrl}/interview/${token}`;

    // Send the email
    const emailSent = await sendInviteEmail({
      to: email,
      name,
      inviteUrl,
    });

    if (!emailSent) {
      logger.warn({ requestId, email }, "Invite created but email failed to send");
    }

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        inviteExpiresAt: session.inviteExpiresAt,
      },
      token,
      url: inviteUrl,
      emailSent,
    });
  } catch (error) {
    logger.error({ requestId, error: error instanceof Error ? error.message : "Unknown error" }, "Invite creation failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
