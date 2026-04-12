import { NextResponse } from "next/server";
import { createInvite } from "@/lib/invites";
import prisma from "@/lib/prisma";

/**
 * POST /api/invites
 * Creates a new candidate and an invite for them.
 * For production, this should be protected by recruiter auth.
 */
export async function POST(request: Request) {
  try {
    const { name, email, questionSetId = "default" } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Upsert candidate
    let candidate = await prisma.candidate.findUnique({ where: { email } });
    if (!candidate) {
      candidate = await prisma.candidate.create({ data: { name, email } });
    }

    const { session, token } = await createInvite(candidate.id, questionSetId);

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        inviteExpiresAt: session.inviteExpiresAt,
      },
      token,
      url: `${new URL(request.url).origin}/?invite=${token}`,
    });
  } catch (error) {
    console.error("Invite creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
