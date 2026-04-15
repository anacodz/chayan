import { NextResponse } from "next/server";
import { validateInvite, hashToken } from "@/lib/invites";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const { valid, session, error } = await validateInvite(token);

    if (!valid || !session) {
      return NextResponse.json({ error: error || "Invalid or expired invitation" }, { status: 401 });
    }

    // Don't return the secret hash to the client
    const { inviteTokenHash, ...safeSession } = session as any;

    return NextResponse.json({ 
      valid: true, 
      session: safeSession 
    });
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const hash = hashToken(token);
    
    await prisma.interviewSession.update({
      where: { inviteTokenHash: hash },
      data: { status: "EXPIRED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite invalidation error:", error);
    return NextResponse.json({ error: "Failed to invalidate invite" }, { status: 500 });
  }
}
