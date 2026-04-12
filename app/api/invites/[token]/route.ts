import { NextResponse } from "next/server";
import { validateInvite } from "@/lib/invites";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const { valid, error, session } = await validateInvite(token);

    if (!valid) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Don't return the sensitive hash
    // @ts-ignore
    const { inviteTokenHash, ...safeSession } = session!;

    return NextResponse.json({ session: safeSession });
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
